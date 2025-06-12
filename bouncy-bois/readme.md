# Three.js Physics Demo

# Demo at - https://bouncy-bois.netlify.app/

^ Kinda broken if you open the console while running this but not an issue if you don't see it :)

---

## Features / What We've Learned

### 1. **Gravity, physics with bouncing objects**

- Rapier vs Cannon
- Structuring object creation
- Sync threejs meshes with rapier colliders

### 2. **Web Worker to Spin Off CPU Threads**

- Add a worker to just handle physics ( position, rotation etc ) and have the main thread just render objects inside the animation frame
- The worker has 0 access to the DOM / element event listeners
- Pass simple data ( no full rapier bodies or threejs meshes ) like rapier body positions / floor rotation between worker / main thread.

### 3. **Object Pooling**

- Kind of a big one; just using ^ web workers isn't enough for performance
- Overtime, if you keep the "rain" running even if you dispose objects every frame the garbage collector will
  struggle with keeping track of newly created objects / removal in memory and the fps will start tanking.
- The "fix" is to put created objects in a reusable pool to be repositioned, the tricky part is keeping the mesh / physics synced

### 4. **Vite Build With Rapier Compat**

- Fix ES Build / vite config cause rapier does top level await when it's instantiated

## Issues / Todos

### 1. **CPU fighting**

- Anytime you let the rain run and you do a bit of a cpu intensive task ( like opening the browser console even ), the web worker will struggle with the physics and will run the function call in a later batch ( the worker will skip the create objects onMessage until way later )

### 2. **Floor Z Fighting**

- There is a strong z fighting between floor / objects, only when the objects bounce off of the floor. Once objects are at terminal rest position, there is no issue. Can't figure this out, did logarithmic buffer in renderer, add a gap in the y axis of object, polygon offset in the mesh, etc.

### 3. **Add New Base Geometries ( Cone / Pyramid, Torus, etc )**

- Creating non default geometries with same dimensions that have to sync with the same threejs mesh is a bit difficult. Tried this with a cone and the way rapier does rotations on the cone is wildly different than threejs

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
