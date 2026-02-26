export const videoSources = {
    gridVideos: [
        "/video/colorful-ball.mp4",
        "/video/tunnel.mp4",
        "/video/infinite-squares.mp4",
    ],
    backgroundVideo: "/video/stars.mp4",
};

export const ANIMATE_ENTRY = "animate-entry";
export const ANIMATE_EXIT = "animate-exit";

export type AnimationType = typeof ANIMATE_ENTRY | typeof ANIMATE_EXIT;
