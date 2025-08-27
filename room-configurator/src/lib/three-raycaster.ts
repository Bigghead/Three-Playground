import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const ROOM_WALL_OFFSET = 0.1;

type ModelChild = three.Group<three.Object3DEventMap>;

const traverseModelChildren = (
	activeModel: ModelChild,
	callbackFunc: (child: three.Mesh) => void
): void => {
	activeModel?.traverse((child) => {
		if (!(child instanceof three.Mesh)) return;
		callbackFunc(child);
	});
};

class DragManager {
	private _activeModel: ModelChild | null = null;
	private _draggableModels: Array<ModelChild> = [];
	private _isDraggingModel = false;
	private _controls: OrbitControls;

	constructor(controls: OrbitControls) {
		this._controls = controls;
	}

	set activeModel(activeModel: ModelChild) {
		this._activeModel = activeModel;
	}

	get activeModel(): ModelChild {
		if (!this._activeModel) throw new Error("No active model");
		return this._activeModel;
	}

	get isDraggingModel(): boolean {
		return this._isDraggingModel;
	}

	addDraggableModel(activeModel: ModelChild) {
		this._draggableModels.push(activeModel);
	}

	getDraggableModels(): Array<ModelChild> {
		return [...this._draggableModels];
	}

	storeOriginalModelColors(activeModel: typeof this._activeModel) {
		const modelOriginalColors: Map<string, three.Material> = new Map();

		traverseModelChildren(activeModel!, (child) => {
			// I effing hate typescript with three.js
			// this material prop can be singular ORRRRRR an array
			// need to check for either for the error to go away
			if (Array.isArray(child.material)) return;

			if (!modelOriginalColors.has(child.uuid)) {
				modelOriginalColors.set(child.uuid, child.material);
			}
		});
		return modelOriginalColors;
	}

	setModelActive(activeModel: ModelChild) {
		this._activeModel = activeModel;
		this._isDraggingModel = true;
		this._controls.enabled = false;
		this._activeModel.userData = {
			originalPosition: activeModel.position.clone(),
			originalColorMaterial: this.storeOriginalModelColors(activeModel),
		};
	}

	updatePosition(position: three.Vector3) {
		if (!this._isDraggingModel || !this.activeModel) return;
		this.activeModel?.position.copy(position);
	}

	endDrag() {
		this._isDraggingModel = false;
		this._controls.enabled = true;
	}

	resetModelPosition(): void {
		if (!this._activeModel) return;
		this._activeModel.position.copy(
			this._activeModel.userData.originalPosition
		);
	}
}

class ModelManager {
	changeModelColor(activeModel: ModelChild, color: string) {
		traverseModelChildren(activeModel, (child) => {
			// I effing hate typescript with three.js
			// this material prop can be singular ORRRRRR an array
			// need to check for either for the error to go away
			if (Array.isArray(child.material)) return;
			if (!activeModel.userData.originalColorMaterial.has(child.uuid)) {
				activeModel.userData.originalColorMaterial.set(
					child.uuid,
					child.material
				);
			}
			const newMat = child.material.clone();
			(newMat as three.MeshStandardMaterial).color.set(color);
			child.material = newMat;
		});
	}

	resetModelColor(activeModel: ModelChild) {
		traverseModelChildren(activeModel, (child) => {
			const originalModelMaterial =
				activeModel.userData.originalColorMaterial.get(child.uuid);
			if (originalModelMaterial) {
				child.material = originalModelMaterial;
			}
		});
	}
}

class CollisionManager {
	private _raycaster = new three.Raycaster();
	private _pointer = new three.Vector2();
	// no idea why i need 1 in the y-axis here, but it works
	private _plane = new three.Plane(new three.Vector3(0, 1, 0), 0);
	private _intersectPoint = new three.Vector3();

	// for checking if an active dragged model is colliding with others
	private _roomBoundingBox = new three.Box3();
	private _activeModelBox = new three.Box3();
	private _modelBox = new three.Box3();
	private _isActiveModelColliding = false;

	private _canvasBoundsRect: DOMRect;
	private _camera: three.PerspectiveCamera;

	modelManager: ModelManager;

	constructor(canvas: HTMLCanvasElement, camera: three.PerspectiveCamera) {
		this._canvasBoundsRect = canvas.getBoundingClientRect();
		this._camera = camera;
		this.modelManager = new ModelManager();
	}

	get raycaster() {
		return this._raycaster;
	}

	get intersectPoint() {
		return this._intersectPoint;
	}

	get activeModelBox() {
		return this._activeModelBox;
	}

	set isactiveModelColliding(isColliding) {
		this._isActiveModelColliding = isColliding;
	}

	get isactiveModelColliding() {
		return this._isActiveModelColliding;
	}

	setRaycastingPointer(event: MouseEvent): void {
		const { clientX, clientY } = event;
		const { left, top, width, height } = this._canvasBoundsRect;

		// if canvas is resized like we have now, the raycaster breaks
		// cause it's using window ( event clientX/Y ) sizes to calculate
		// need to set the sizes using the canvas bounding rect
		this._pointer.x = ((clientX - left) / width) * 2 - 1;
		// the freaking y has to be inverted cause the browser reads it backwards
		this._pointer.y = -((clientY - top) / height) * 2 + 1;

		this._raycaster.setFromCamera(this._pointer, this._camera);
	}

	checkIntersectPlane(): three.Vector3 | null {
		// this checks if a ray is intersecting our plane
		// and sets / updates intersectPoint
		return this._raycaster.ray.intersectPlane(
			this._plane,
			this._intersectPoint
		);
	}

	checkModelCollision(
		activeModel: ModelChild,
		activeModelBox: three.Box3,
		models: Array<ModelChild>
	): boolean {
		if (!models.length) return false;

		for (const model of models) {
			if (model !== activeModel) {
				const modelBox = this._modelBox.setFromObject(model);
				if (activeModelBox.intersectsBox(modelBox)) {
					return true;
				}
			}
		}

		return false;
	}

	handleCollidingModel(
		activeModel: ModelChild,
		isColliding: boolean = false
	): void {
		if (isColliding) {
			this.modelManager.changeModelColor(activeModel, "red");
			this._isActiveModelColliding = true;
		} else {
			this.modelManager.resetModelColor(activeModel);
			this._isActiveModelColliding = false;
		}
	}

	setRoomBoundingBox(roomSize: three.Vector3) {
		const { x, y, z } = roomSize;
		this._roomBoundingBox.set(
			new three.Vector3(
				-x / 2 + ROOM_WALL_OFFSET,
				0,
				-z / 2 + ROOM_WALL_OFFSET
			),
			new three.Vector3(x / 2 - ROOM_WALL_OFFSET, y, z / 2 - ROOM_WALL_OFFSET)
		);
	}

	/**
	 * Use room min/max coordinates to check if dragged object is hitting edges
	 * Clamp / stop the drag by backing off dragged model slightly
	 */
	checkRoomBounds(activeModel: ModelChild) {
		const activeModelBox = this.activeModelBox;
		const { min, max } = this._roomBoundingBox;
		const { position } = activeModel;

		// X axis
		if (activeModelBox.min.x < min.x)
			position.x += min.x - activeModelBox.min.x;
		if (activeModelBox.max.x > max.x)
			position.x -= activeModelBox.max.x - max.x;

		// Z
		if (activeModelBox.min.z < min.z)
			position.z += min.z - activeModelBox.min.z;
		if (activeModelBox.max.z > max.z)
			position.z -= activeModelBox.max.z - max.z;
	}

	resetModel(activeModel: ModelChild): void {
		this.modelManager.resetModelColor(activeModel);
	}
}

export class ThreeRaycaster {
	camera: three.PerspectiveCamera;
	scene: three.Scene;
	controls: OrbitControls;

	dragManager: DragManager;
	collisionManager: CollisionManager;

	constructor({
		canvas,
		camera,
		scene,
		controls,
	}: {
		canvas: HTMLCanvasElement;
		camera: three.PerspectiveCamera;
		scene: three.Scene;
		controls: OrbitControls;
	}) {
		this.camera = camera;
		this.scene = scene;
		this.controls = controls;
		this.dragManager = new DragManager(this.controls);
		this.collisionManager = new CollisionManager(canvas, camera);
	}

	setRoomBoundingBox(roomSize: three.Vector3): void {
		this.collisionManager.setRoomBoundingBox(roomSize);
	}

	addDraggableModel(activeModel: ModelChild): void {
		this.dragManager.addDraggableModel(activeModel);
	}

	resetActiveModel(activeModel: ModelChild): void {
		this.dragManager.resetModelPosition();
		this.collisionManager.resetModel(activeModel);
	}

	onMouseMove(event: MouseEvent): void {
		// need to break this all up
		this.collisionManager.setRaycastingPointer(event);

		const activeModel = this.dragManager.activeModel;
		const isDragging = this.dragManager.isDraggingModel;
		const isIntersecting = this.collisionManager.checkIntersectPlane();

		const models = this.dragManager.getDraggableModels();

		if (!activeModel || !isDragging || !isIntersecting) return;

		this.dragManager.updatePosition(this.collisionManager.intersectPoint);
		const activeModelBox =
			this.collisionManager.activeModelBox.setFromObject(activeModel);

		this.collisionManager.checkRoomBounds(activeModel);

		const isColliding = this.collisionManager.checkModelCollision(
			activeModel,
			activeModelBox,
			models
		);
		this.collisionManager.handleCollidingModel(activeModel, isColliding);
	}

	onMouseDown(event: MouseEvent): void {
		this.collisionManager.setRaycastingPointer(event);
		const models = this.dragManager.getDraggableModels();

		for (const model of models) {
			const intersects = this.collisionManager.raycaster.intersectObject(
				model,
				true
			);
			if (intersects.length > 0) {
				this.collisionManager.isactiveModelColliding = true;
				this.dragManager.setModelActive(model);
				break;
			}
		}
	}

	onMouseUp(): void {
		const activeModel = this.dragManager.activeModel;

		const isColliding = this.collisionManager.isactiveModelColliding;
		this.collisionManager.handleCollidingModel(activeModel, isColliding);

		if (isColliding) {
			this.resetActiveModel(activeModel);
		}

		this.dragManager.endDrag();
	}
}
