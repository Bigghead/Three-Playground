# Three.js Haunted House Demo

Culmination of what we've learned so far

## Demo at https://strong-sawine-542626.netlify.app/

---

## Features / What We've Learned

###\*. \*\*The main things are just hammering down on threejs fundies\*\*

- Camera near / far, mesh positioning, texture mapping, lighting / shadow maps, tick loop animations for the ghost lights etc

### 1. **Using 1st Party Geometries as Building Blocks**

- No Blender work yet, everything is still using geometries that come with threejs

### 2. **Textures, oh boi**

- Everything textured and normalized / roughed / diffused, etc. The main change is minifying the asset textures
  to smallest that they can be served without nuking the quality ( webp for most, jpg for normals if possible )

### 3. **Lighting / Shadows**

- Point Ligting with receiving shadowmap meshes ( graves, floor, etc ) with rotating random "ghost" lights

### 4. **Sky**

- Don't understand this yet, but used the example from threejs docs demo

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
