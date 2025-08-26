import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ModelChild = three.Group<three.Object3DEventMap>;

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

	get activeModel(): ModelChild | null {
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

	private traverseModelChildren(
		activeModel: typeof this._activeModel,
		callbackFunc: (child: three.Mesh) => void
	): void {
		activeModel?.traverse((child) => {
			if (!(child instanceof three.Mesh)) return;
			callbackFunc(child);
		});
	}

	storeOriginalModelColors(activeModel: typeof this._activeModel) {
		const modelOriginalColors: Map<string, three.Material> = new Map();

		this.traverseModelChildren(activeModel, (child) => {
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
		console.log("model clicked");
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
		this._activeModel.position.copy(this._activeModel.userData.position);
	}
}

class CollisionManager {}

export class ThreeRaycaster {
	private raycaster = new three.Raycaster();
	private pointer = new three.Vector2();
	// no idea why i need 1 in the y-axis here, but it works
	private plane = new three.Plane(new three.Vector3(0, 1, 0), 0);
	private intersectPoint = new three.Vector3();

	private draggableModelOriginalColors: Map<string, three.Material> = new Map();

	// for checking if an active dragged model is colliding with others
	private roomBoundingBox = new three.Box3();
	private activeModelBox = new three.Box3();
	private modelBox: typeof this.activeModelBox = new three.Box3();
	private isactiveModelColliding = false;
	private _originalDragModelPosition: three.Vector3 = new three.Vector3();

	canvasBoundsRect: DOMRect;
	camera: three.PerspectiveCamera;
	scene: three.Scene;
	controls: OrbitControls;

	dragManager: DragManager;

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
		this.canvasBoundsRect = canvas.getBoundingClientRect();
		this.camera = camera;
		this.scene = scene;
		this.controls = controls;
		this.dragManager = new DragManager(this.controls);
	}

	setRoomBoundingBox(roomSize: three.Vector3): void {
		const { x, y, z } = roomSize;
		this.roomBoundingBox.set(
			new three.Vector3(-x / 2 + 0.1, 0, -z / 2 + 0.1),
			new three.Vector3(x / 2 - 0.1, y, z / 2 - 0.1)
		);
	}

	addDraggableModel(activeModel: ModelChild) {
		this.dragManager.addDraggableModel(activeModel);
	}

	private setRaycastingPointer(event: MouseEvent): void {
		const { clientX, clientY } = event;
		const { left, top, width, height } = this.canvasBoundsRect;

		// if canvas is resized like we have now, the raycaster breaks
		// cause it's using window ( event clientX/Y ) sizes to calculate
		// need to set the sizes using the canvas bounding rect
		this.pointer.x = ((clientX - left) / width) * 2 - 1;
		// the freaking y has to be inverted cause the browser reads it backwards
		this.pointer.y = -((clientY - top) / height) * 2 + 1;

		this.raycaster.setFromCamera(this.pointer, this.camera);
	}

	/**
	 * Use room min/max coordinates to check if dragged object is hitting edges
	 * Clamp / stop the drag by backing off dragged model slightly
	 */
	private checkRoomBounds(activeModelBox: three.Box3) {
		if (!this.activeModel) return;
		const { min, max } = this.roomBoundingBox;
		const { position } = this.activeModel;

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

	private checkModelCollision(
		activeModel: typeof this.activeModel,
		activeModelBox: three.Box3
	): boolean {
		if (!activeModel) return false;
		const models = this.dragManager.getDraggableModels();
		for (const model of models) {
			if (model !== activeModel) {
				const modelBox = this.modelBox.setFromObject(model);
				if (activeModelBox.intersectsBox(modelBox)) {
					console.log("intersecting");
					return true;
				}
			}
		}

		return false;
	}

	private handleCollidingModel(
		activeModel: typeof this.activeModel,
		isColliding: boolean = false
	): void {
		if (isColliding) {
			this.changeModelColor(activeModel, "red");
			this.isactiveModelColliding = true;
		} else {
			// this.resetModelColor(activeModel);
			// this.dragManager.endDrag();
			this.isactiveModelColliding = false;
		}
	}

	// private changeModelColor(
	// 	activeModel: typeof this.activeModel,
	// 	color: string
	// ) {
	// 	this.traverseModelChildren(activeModel, (child) => {
	// 		// I effing hate typescript with three.js
	// 		// this material prop can be singular ORRRRRR an array
	// 		// need to check for either for the error to go away
	// 		if (Array.isArray(child.material)) return;

	// 		if (!this.draggableModelOriginalColors.has(child.uuid)) {
	// 			this.draggableModelOriginalColors.set(child.uuid, child.material);
	// 		}

	// 		const newMat = child.material.clone();
	// 		(newMat as three.MeshStandardMaterial).color.set(color);
	// 		child.material = newMat;
	// 	});
	// }

	private resetModelColor(activeModel: typeof this.activeModel) {
		this.traverseModelChildren(activeModel, (child) => {
			const originalModelMaterial = this.draggableModelOriginalColors.get(
				child.uuid
			);
			if (originalModelMaterial) {
				child.material = originalModelMaterial;
			}
		});
	}

	onMouseMove(event: MouseEvent): void {
		this.setRaycastingPointer(event);

		const activeModel = this.dragManager.activeModel;
		const isDragging = this.dragManager.isDraggingModel;

		// this sets / updates intersectPoint
		if (!this.raycaster.ray.intersectPlane(this.plane, this.intersectPoint))
			return;
		if (!activeModel || !isDragging) return;

		this.dragManager.updatePosition(this.intersectPoint);
		const activeModelBox = this.activeModelBox.setFromObject(activeModel);

		this.checkRoomBounds(activeModelBox);

		const isColliding = this.checkModelCollision(activeModel, activeModelBox);
		this.handleCollidingModel(activeModel, isColliding);
	}

	onMouseDown(event: MouseEvent): void {
		this.setRaycastingPointer(event);
		const models = this.dragManager.getDraggableModels();
		for (const model of models) {
			const intersects = this.raycaster.intersectObject(model, true);
			if (intersects.length > 0) {
				this.dragManager.setModelActive(model);
				this._originalDragModelPosition = model.position.clone();
				break;
			}
		}
	}

	private resetactiveModelPosition(activeModel: typeof this.activeModel) {
		activeModel?.position.copy(this._originalDragModelPosition!);
		this.handleCollidingModel(this.activeModel, false);
	}

	onMouseUp(): void {
		// if (this.isactiveModelColliding) {
		// 	this.dragManager.resetModelPosition();
		// }
		this.dragManager.endDrag();
	}
}
