import type { RoomDimension, TextureConfig } from "../types";

export const DimensionControl = (dimension: RoomDimension): HTMLDivElement => {
    const container = document.createElement("div");
    container.className = "content-child";
    container.dataset.dimension = dimension.key;
    container.dataset.changeStep = String(dimension.step);
    container.dataset.changeMin = String(dimension.min);
    container.dataset.changeMax = String(dimension.max);

    container.innerHTML = `
        <label>${dimension.label}</label>
        <div class="content-child__action">
            <button data-action="decrement" class="subtract-btn hover-animate">-</button>
            <div><span class="value">${dimension.value}</span>m</div>
            <button data-action="increment" class="add-btn hover-animate">+</button>
        </div>
    `;

    return container;
};

export const TextureCard = (
    texture: TextureConfig,
    isActive: boolean,
): HTMLDivElement => {
    const container = document.createElement("div");
    container.className = "texture";

    const childTextureName = document.createElement("div");
    childTextureName.textContent = texture.name;

    const childTextureImage = document.createElement("img");
    childTextureImage.src = texture.src;
    childTextureImage.alt = texture.alt;
    childTextureImage.dataset.textureMap = texture.map;
    childTextureImage.className = "texture-img";
    childTextureImage.classList.toggle("active", isActive);
    childTextureImage.loading = "lazy";

    container.appendChild(childTextureName);
    container.appendChild(childTextureImage);

    return container;
};
