import * as three from "three";

export class QuadrantCheck {
    private _quadrants: Map<string, number> = new Map();

    get quadrants() {
        return this._quadrants;
    }

    public setBoidQuadrant(position: three.Vector3): void {
        const quadrantPosition = this.normalizeQuadrant(position);
        const current = this._quadrants.get(quadrantPosition) ?? 0;
        this._quadrants.set(quadrantPosition, current + 1);
    }

    private normalizeQuadrant(position: three.Vector3): string {
        return `${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}`;
    }
}
