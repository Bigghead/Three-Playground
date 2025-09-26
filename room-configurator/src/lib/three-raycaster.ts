import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
import { ACTIVE_MODEL_CLICKED, INACTIVE_MODEL_EVENT } from "./constants";

// room wall has a depth of 0.1
const ROOM_WALL_OFFSET = 0.1;

type ModelChild = three.Group<three.Object3DEventMap>;

const traverseModelChildren = (
	activeModel: ModelChild,
	callbackFunc: (child: three.Mesh) => void
): void => {
	activeModel?.traverse((child) => {
		if (!(child instanceof three.Mesh)) return;
		if (Array.isArray(child.material)) return;
		callbackFunc(child);
	});
};

class ModelManager {
	modelInactiveEvent = new Event(INACTIVE_MODEL_EVENT);

	private _composer: EffectComposer;
	private _outlinePass: OutlinePass;

	constructor({
		canvas,
		scene,
		camera,
		renderer,
	}: {
		canvas: HTMLCanvasElement;
		camera: three.PerspectiveCamera;
		scene: three.Scene;
		renderer: three.WebGLRenderer;
	}) {
		this._composer = new EffectComposer(renderer);

		const renderPass = new RenderPass(scene, camera);
		this._composer.addPass(renderPass);

		this._outlinePass = new OutlinePass(
			new three.Vector2(canvas.width, canvas.height),
			scene,
			camera
		);
		this._outlinePass.edgeStrength = 2.5;
		this._outlinePass.edgeGlow = 0.0;
		this._outlinePass.edgeThickness = 1.0;
		this._outlinePass.visibleEdgeColor.set("#ffffff");
		this._outlinePass.hiddenEdgeColor.set("#ffffff");
		this._composer.addPass(this._outlinePass);

		const gammaCorrection = new ShaderPass(GammaCorrectionShader);
		this._composer.addPass(gammaCorrection);
	}

	highlight(activeModel: ModelChild): void {
		this._outlinePass.selectedObjects = [activeModel];
	}

	removeHighlight(): void {
		this._outlinePass.selectedObjects = [];
	}

	changeModelColor(activeModel: ModelChild, color: string): void {
		traverseModelChildren(activeModel, (child) => {
			if (!activeModel.userData.originalColorMaterial.has(child.uuid)) {
				activeModel.userData.originalColorMaterial.set(
					child.uuid,
					child.material
				);
			}
			const newMat = (child.material as three.Material).clone();
			(newMat as three.MeshStandardMaterial).color.set(color);
			child.material = newMat;
		});
	}

	resetModelColor(activeModel: ModelChild): void {
		traverseModelChildren(activeModel, (child) => {
			const originalModelMaterial =
				activeModel.userData.originalColorMaterial.get(child.uuid);
			if (originalModelMaterial) {
				child.material = originalModelMaterial;
			}
		});
	}

	handleActiveModel(eventTarget: EventTarget, model: ModelChild): void {
		eventTarget.dispatchEvent(
			new CustomEvent(ACTIVE_MODEL_CLICKED, {
				detail: {
					id: model.uuid,
					rotation: model.rotation,
					scale: model.scale,
					type: model.userData?.type || null,
				},
			})
		);

		document.body.style.cursor = "grabbing";
		this.highlight(model);
	}

	handleInactiveModel(eventTarget: EventTarget): void {
		eventTarget.dispatchEvent(this.modelInactiveEvent);
		this.removeHighlight();
	}

	render(): void {
		this._composer.render();
	}
}

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

	get draggableModels(): Array<ModelChild> {
		return [...this._draggableModels];
	}

	set draggableModels(models: ModelChild[]) {
		this._draggableModels = models;
	}

	addDraggableModel(activeModel: ModelChild): void {
		this._draggableModels.push(activeModel);
	}

	removeDraggableModel(activeModel: ModelChild): void {
		const { uuid } = activeModel;
		this._draggableModels = this.draggableModels.filter(
			(model) => model.uuid !== uuid
		);
	}

	storeOriginalModelColors(activeModel: ModelChild) {
		const modelOriginalColors: Map<string, three.Material> = new Map();

		traverseModelChildren(activeModel!, (child) => {
			if (!modelOriginalColors.has(child.uuid)) {
				modelOriginalColors.set(child.uuid, child.material as three.Material);
			}
		});
		return modelOriginalColors;
	}

	setModelActive(activeModel: ModelChild) {
		this._activeModel = activeModel;
		this._isDraggingModel = true;
		this._controls.enabled = false;
		this._activeModel.userData = {
			...this._activeModel.userData,
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

	constructor({
		canvas,
		camera,
		modelManager,
	}: {
		canvas: HTMLCanvasElement;
		camera: three.PerspectiveCamera;
		modelManager: ModelManager;
	}) {
		this._canvasBoundsRect = canvas.getBoundingClientRect();
		this._camera = camera;
		this.modelManager = modelManager;
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
		// inverted y cause the browser reads it backwards
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

	/**
	 * Creates a min / max room outer edges to check model bounds against later
	 */
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
}

export class ThreeRaycaster {
	camera: three.PerspectiveCamera;
	scene: three.Scene;
	controls: OrbitControls;

	dragManager: DragManager;
	collisionManager: CollisionManager;
	modelManager: ModelManager;

	constructor({
		canvas,
		camera,
		scene,
		controls,
		renderer,
	}: {
		canvas: HTMLCanvasElement;
		camera: three.PerspectiveCamera;
		scene: three.Scene;
		controls: OrbitControls;
		renderer: three.WebGLRenderer;
	}) {
		this.camera = camera;
		this.scene = scene;
		this.controls = controls;
		this.dragManager = new DragManager(this.controls);
		this.modelManager = new ModelManager({
			canvas,
			scene: this.scene,
			camera: this.camera,
			renderer,
		});

		this.collisionManager = new CollisionManager({
			canvas,
			camera,
			modelManager: this.modelManager,
		});
	}

	setRoomBoundingBox(roomSize: three.Vector3): void {
		this.collisionManager.setRoomBoundingBox(roomSize);
	}

	addDraggableModel(activeModel: ModelChild): void {
		this.dragManager.addDraggableModel(activeModel);
	}

	resetActiveModel(activeModel: ModelChild): void {
		this.dragManager.resetModelPosition();
		this.modelManager.resetModelColor(activeModel);
	}

	rotateModel(degree: string): void {
		if (!this.dragManager.activeModel) return;
		const rad = three.MathUtils.degToRad(parseInt(degree));
		this.dragManager.activeModel.rotation.y = rad;
	}

	editWidthModel(width: string): void {
		if (!this.dragManager.activeModel) return;
		const originalWidth = 3;
		const newWidth = parseFloat(width) / originalWidth;

		this.dragManager.activeModel.scale.set(newWidth, 1, 1);
	}

	resetModelChanges(): void {
		if (!this.dragManager.activeModel) return;
		this.dragManager.activeModel.rotation.y = 0;
		this.dragManager.activeModel.scale.set(1, 1, 1);
	}

	removeActiveModel(): void {
		if (!this.dragManager.activeModel) return;
		const activeModel = this.dragManager.activeModel;

		traverseModelChildren(activeModel, (child) => {
			child.geometry.dispose();
			if (Array.isArray(child.material)) {
				child.material.forEach((material) => material.dispose());
			} else {
				child.material.dispose();
			}
		});

		this.dragManager.removeDraggableModel(activeModel);
		if (activeModel.parent) {
			activeModel.parent.remove(activeModel);
		}
	}

	onMouseMove(event: MouseEvent): void {
		const { activeModel, isDraggingModel } = this.dragManager;
		if (!activeModel || !isDraggingModel) return;

		this.collisionManager.setRaycastingPointer(event);
		const isIntersecting = this.collisionManager.checkIntersectPlane();
		if (!isIntersecting) return;

		const models = this.dragManager.draggableModels;

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
		if (!(event.target instanceof HTMLCanvasElement)) return;
		this.collisionManager.setRaycastingPointer(event);
		const models = this.dragManager.draggableModels;

		for (const model of models) {
			const intersects = this.collisionManager.raycaster.intersectObject(
				model,
				true
			);

			if (intersects.length > 0) {
				this.dragManager.setModelActive(model);
				this.modelManager.handleActiveModel(event.target, model);
				break;
			} else {
				this.modelManager.handleInactiveModel(event.target);
			}
		}
	}

	onMouseUp(): void {
		document.body.style.cursor = "default";
		const activeModel = this.dragManager.activeModel;
		if (!activeModel) return;

		const isColliding = this.collisionManager.isactiveModelColliding;

		if (isColliding) {
			this.resetActiveModel(activeModel);
		}

		this.dragManager.endDrag();
	}

	animate() {
		this.modelManager.render();
	}
}
