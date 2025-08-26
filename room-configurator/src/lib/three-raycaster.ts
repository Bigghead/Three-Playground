import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ModelChild = three.Group<three.Object3DEventMap>;

export class ThreeRaycaster {
	private raycaster = new three.Raycaster();
	private pointer = new three.Vector2();
	// no idea why i need 1 in the y-axis here, but it works
	private plane = new three.Plane(new three.Vector3(0, 1, 0), 0);
	private intersectPoint = new three.Vector3();

	private activeModel: ModelChild | null = null;
	private draggableModels: Array<ModelChild> = [];
	private draggableModelOriginalColors: Map<string, three.Material> = new Map();
	private isDraggingModel = false;

	// for checking if an active dragged model is colliding with others
	private roomBoundingBox = new three.Box3();
	private activeModelBox = new three.Box3();
	private modelBox: typeof this.activeModelBox = new three.Box3();
	private isactiveModelColliding = false;
	private tempVector = new three.Vector3();
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

	setRoomBoundingBox(roomSize: three.Vector3): void {
		const { x, y, z } = roomSize;
		this.roomBoundingBox.set(
			new three.Vector3(-x / 2 + 0.1, 0, -z / 2 + 0.1),
			new three.Vector3(x / 2 - 0.1, y, z / 2 - 0.1)
		);
	}

	addDraggableModel(activeModel: ModelChild) {
		this.draggableModels.push(activeModel);
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
	}

	private checkModelCollision(
		activeModel: typeof this.activeModel,
		activeModelBox: three.Box3
	): boolean {
		if (!activeModel) return false;

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

	private handleCollidingModel(
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

	private changeModelColor(
		activeModel: typeof this.activeModel,
		color: string
	) {
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

		if (!this.raycaster.ray.intersectPlane(this.plane, this.intersectPoint))
			return;
		if (!this.isDraggingModel || !this.activeModel) return;

		const activeModelBox = this.activeModelBox.setFromObject(this.activeModel);
		this.activeModel!.position.copy(this.intersectPoint);

		this.checkRoomBounds(activeModelBox);

		this.controls.enabled = false;
		const isColliding = this.checkModelCollision(
			this.activeModel,
			activeModelBox
		);
		this.handleCollidingModel(this.activeModel, isColliding);
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

	private resetactiveModelPosition(activeModel: typeof this.activeModel) {
		activeModel?.position.copy(this._originalDragModelPosition!);
		this.handleCollidingModel(this.activeModel, false);
	}

	onMouseUp(): void {
		if (this.isactiveModelColliding) {
			this.resetactiveModelPosition(this.activeModel);
		}
		this.resetDrag();
	}

	private resetDrag(): void {
		this.controls.enabled = true;
		this.isDraggingModel = false;
	}
}
