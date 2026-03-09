import * as three from "three";
import type { ButterflyBoid } from "./ButterflyBoid";

export class QuadrantCheck {
    private _quadrants: Map<string, ButterflyBoid[]> = new Map();

    get quadrants() {
        return this._quadrants;
    }

    public setBoidQuadrant(boid: ButterflyBoid): void {
        const quadrantPosition = this.normalizeQuadrant(boid.position);

        const list = this._quadrants.get(quadrantPosition) ?? [];
        list.push(boid);

        this._quadrants.set(quadrantPosition, list);
    }

    // ===== Need to actually check distance between neighbors ===== //
    public checkNeigbors(boid: ButterflyBoid) {
        let hasNeighbors = false;
        let neighbors: ButterflyBoid[] = [];

        /**
         * check 27 "surrounding" cell faces from current boid quadrant
         * so we only check max 27 times for each boid
         */
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    // skip checking its own position
                    if (i === 0 && j === 0 && k === 0) continue;

                    const boidPosition = this.normalizeQuadrant(
                        new three.Vector3(
                            boid.position.x + i,
                            boid.position.y + j,
                            boid.position.z + k,
                        ),
                    );

                    const quadrant = this._quadrants.get(boidPosition);
                    if (!quadrant) continue;

                    for (const cell of quadrant) {
                        if (cell !== boid) {
                            hasNeighbors = true;
                            neighbors.push(cell);
                        }
                    }
                }
            }
        }
        return {
            hasNeighbors: neighbors.some((neighbor) => {
                return (
                    neighbor !== boid &&
                    boid.position.distanceToSquared(neighbor.position) < 2
                );
            }),
        };
    }

    private normalizeQuadrant(position: three.Vector3): string {
        return `${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}`;
    }
}
