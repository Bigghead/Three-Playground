# Demo at - WIP ( example screenshots here though ):
<img width="2557" height="1378" alt="butterfly image" src="https://github.com/user-attachments/assets/e697bab2-3198-4d5b-ad23-3bad0a6a4b82" />

<p>&nbsp;</p>
( GPU Instancing, 10k Instances / 240fps )

![butterfly-demo](https://github.com/user-attachments/assets/36186088-8f2f-4d66-8e08-a2468729c80d)

<p>&nbsp;</p>
( GPU Instancing, 500 Instances / naive neighbor collision )

![butterfly-neighbors](https://github.com/user-attachments/assets/5cba46e8-d519-4778-a06a-70917cbb43f1)

<p>&nbsp;</p>
( GPU Instancing, 2000 Instances / / quadrant split neighbor checking / 240fps )

![butterfly-quadrants-2](https://github.com/user-attachments/assets/9e3ff318-ff5c-41f7-8bd5-4a75d89744db)






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
