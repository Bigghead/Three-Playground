# Demo at - WIP

## Features / What We've Learned

### 1. **Shader Plane Meshing**

- Use texture in shader and animate individual pixels to mimic wing flap

### 2. **Boid Logic**

- Mesh mimics "flying". We got this working on day one, but the trick was to rotate mesh on x axis to fly flat which took a surprising amount of time to figure out
- Mesh can change course if colliding with each other or out of boundaries
- Mesh follows biggest nearby flock. Though tbh don't know if we want this cause the randomized move is prettier

### 3. **Fun Optimizations**

- GPU Instancing, my love. How did we go so long without meeting each other? Went up to 10,000 instances and still hit 240fps.
- Then did naive nested loop in each mesh to check for neighbors with 500 instances. Works but slow
- Then splitting the globe scene into quadrants, only checking meshes directly touching current quadrant with 2k instances

## Todos

### 1. **Beautify**

- Add object in the middle ( maybe a snowgblobe scene? ) for the butterflies to fly around.

---

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Steps

1. Clone the repository:

    ```bash
    git clone <repository-url>
    ```

2. Navigate to the project directory:

    ```bash
    cd <project-directory>
    ```

3. Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    ```

4. Start the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

---
