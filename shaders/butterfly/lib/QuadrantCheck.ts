import type { ButterflyBoid } from "./ButterflyBoid";

export class QuadrantCheck {
    private _quadrants: Map<number, ButterflyBoid[]> = new Map();

    get quadrants() {
        return this._quadrants;
    }

    public setBoidQuadrant(boid: ButterflyBoid): void {
        const { baseX, baseY, baseZ } = this.normalizePosition(boid);

        const quadrantPosition = this.getQuadrantKey(baseX, baseY, baseZ);

        const list = this._quadrants.get(quadrantPosition) ?? [];
        list.push(boid);
        this._quadrants.set(quadrantPosition, list);
    }

    public clearQuadrant() {
        this._quadrants.clear();
    }

    public checkNeigbors(boid: ButterflyBoid): { hasNeighbors: boolean } {
        let neighbors: number = 0;

        const { baseX, baseY, baseZ } = this.normalizePosition(boid);

        /**
         * check 27 "surrounding" cell faces from current boid quadrant
         * so we only check max 27 times for each boid
         */
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    // skip checking its own position
                    if (i === 0 && j === 0 && k === 0) continue;

                    const quadrantKey = this.getQuadrantKey(
                        baseX + i,
                        baseY + j,
                        baseZ + k,
                    );

                    const quadrant = this._quadrants.get(quadrantKey);
                    if (!quadrant) continue;

                    for (const cell of quadrant) {
                        if (cell === boid) continue;
                        if (
                            cell.position.distanceToSquared(boid.position) < 2
                        ) {
                            neighbors++;
                        }
                    }
                }
            }
        }
        return {
            hasNeighbors: neighbors > 0,
        };
    }

    private normalizePosition(boid: ButterflyBoid): {
        baseX: number;
        baseY: number;
        baseZ: number;
    } {
        return {
            baseX: Math.floor(boid.position.x),
            baseY: Math.floor(boid.position.y),
            baseZ: Math.floor(boid.position.z),
        };
    }

    /**
     * this is amazing, we're using integer spatial hashing instead of strings
     * cause checking string keys in the map is slooooow
     */
    private getQuadrantKey(x: number, y: number, z: number): number {
        const PRIME1 = 73856093;
        const PRIME2 = 19349663;
        const PRIME3 = 83492791;

        return (x * PRIME1) ^ (y * PRIME2) ^ (z * PRIME3);
    }
}
