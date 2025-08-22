import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ModelChild = three.Group<three.Object3DEventMap>;

export class ThreeRaycaster {
	raycaster: three.Raycaster = new three.Raycaster();
	pointer: three.Vector2 = new three.Vector2();
	// no idea why i need 1 in the y-axis here, but it works
	plane: three.Plane = new three.Plane(new three.Vector3(0, 1, 0), 0);
	intersectPoint: three.Vector3 = new three.Vector3();

	activeModel: ModelChild | null = null;
	draggableModels: Array<ModelChild> = [];
	draggableModelOriginalColors: Map<string, three.Material> = new Map();
	isDraggingModel: boolean = false;

	// for checking if an active dragged model is colliding with others
	activeModelBox: three.Box3 = new three.Box3();
	modelBox: typeof this.activeModelBox = new three.Box3();
	isactiveModelColliding: boolean = false;
	private _originalDragModelPosition: three.Vector3 = new three.Vector3();

	canvasBoundsRect: DOMRect;
	camera: three.PerspectiveCamera;
	scene: three.Scene;
	controls: OrbitControls;

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
	}

	addDraggableModel(activeModel: ModelChild) {
		this.draggableModels.push(activeModel);
		console.log(this.draggableModels);
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

	private traverseModelChildren(
		activeModel: typeof this.activeModel,
		callbackFunc: (child: three.Mesh) => void
	): void {
		activeModel?.traverse((child) => {
			if (!(child instanceof three.Mesh)) return;
			callbackFunc(child);
		});
	}

	changeModelColor(activeModel: typeof this.activeModel, color: string) {
		this.traverseModelChildren(activeModel, (child) => {
			// I effing hate typescript with three.js
			// this material prop can be singular ORRRRRR an array
			// need to check for either for the error to go away
			if (Array.isArray(child.material)) return;

			if (!this.draggableModelOriginalColors.has(child.uuid)) {
				this.draggableModelOriginalColors.set(child.uuid, child.material);
			}

			const newMat = child.material.clone();
			(newMat as three.MeshStandardMaterial).color.set(color);
			child.material = newMat;
		});
	}

	resetModelColor(activeModel: typeof this.activeModel) {
		this.traverseModelChildren(activeModel, (child) => {
			const originalModelMaterial = this.draggableModelOriginalColors.get(
				child.uuid
			);
			if (originalModelMaterial) {
				child.material = originalModelMaterial;
			}
		});
	}

	checkModelCollision(activeModel: typeof this.activeModel): boolean {
		if (!activeModel) return false;
		const activeModelBox = this.activeModelBox.setFromObject(activeModel);

		for (const model of this.draggableModels) {
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

	handleCollidingModel(
		activeModel: typeof this.activeModel,
		isColliding: boolean = false
	): void {
		if (isColliding) {
			this.changeModelColor(activeModel, "red");
			this.isactiveModelColliding = true;
		} else {
			this.resetModelColor(activeModel);
			this.resetDrag;
			this.isactiveModelColliding = false;
		}
	}

	onMouseMove(event: MouseEvent): void {
		this.setRaycastingPointer(event);
		if (!this.raycaster.ray.intersectPlane(this.plane, this.intersectPoint))
			return;
		if (!this.isDraggingModel || !this.activeModel) return;

		this.controls.enabled = false;
		const isColliding = this.checkModelCollision(this.activeModel);
		this.handleCollidingModel(this.activeModel, isColliding);
		this.activeModel!.position.copy(this.intersectPoint);
	}

	onMouseDown(event: MouseEvent): void {
		this.setRaycastingPointer(event);

		for (const model of this.draggableModels) {
			const intersects = this.raycaster.intersectObject(model, true);
			if (intersects.length > 0) {
				this.activeModel = model;
				this.isDraggingModel = true;
				this.controls.enabled = false;
				this._originalDragModelPosition = model.position.clone();
				break;
			}
		}
	}

	resetactiveModelPosition(activeModel: typeof this.activeModel) {
		activeModel?.position.copy(this._originalDragModelPosition!);
		this.handleCollidingModel(this.activeModel, false);
	}

	onMouseUp(): void {
		if (this.isactiveModelColliding) {
			this.resetactiveModelPosition(this.activeModel);
		}
		this.resetDrag();
	}

	resetDrag(): void {
		this.controls.enabled = true;
		this.isDraggingModel = false;
	}
}
