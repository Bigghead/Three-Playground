# Three.js Textures / Lighting Demo

Remaking the textures demo as we learn more three.js concepts

## Demo at https://amazing-maamoul-caa601.netlify.app/

---

## Features / What We've Learned

### 1. **Different Texture Mapping**

- Textures packs need to be compressed, even flat textures can be big in size.
- Normals / texture terrains need to be mapped separately.

### 2. **Debug GUI**

- Debugging interface from Lil-GUI, this is pretty cool to visualize changes in dev and prod if you need it

### 3. **Lighting**

- Rotating point lighting to see how the different textures would get illuminated

### 4. **Environment Map**

- This is a big one ( literal ). Env maps can get massive in size, with 4k resolution getting up to 50Mb in size.
  Even compressing these would still have 5x all other textures combined.
  Found Gain Mapping compression that was ported to JS to help render env map from a jpeg

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
