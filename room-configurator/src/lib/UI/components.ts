import type { RoomDimension, TextureConfig } from "../types";

export const DimensionControl = (dimension: RoomDimension): string => `
    <div class="content-child"
        data-dimension="${dimension.key}"
        data-change-step="${dimension.step}"
        data-change-min="${dimension.min}"
        data-change-max="${dimension.max}">
        <label>${dimension.label}</label>
        <div class="content-child__action">
            <button data-action="decrement" class="subtract-btn hover-animate">-</button>
            <div><span class="value">${dimension.value}</span>m</div>
            <button data-action="increment" class="add-btn hover-animate">+</button>
        </div>
    </div>
`;

export const TextureCard = (
    texture: TextureConfig,
    isActive: boolean
): string => `
    <div class="texture">
        <div class="texture-name">${texture.name}</div>
        <img
            src="${texture.src}"
            alt="${texture.alt}"
            data-texture-map="${texture.map}"
            class="texture-img ${isActive ? "active" : ""}"
        />
    </div>
`;
