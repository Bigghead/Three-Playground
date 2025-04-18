const elements = {
  "video-container": document.querySelector(
    ".video-container video"
  ) as HTMLVideoElement,
  "video-preview": document.querySelector(
    ".video-preview video"
  ) as HTMLVideoElement,
};

let currentVideo = 1;
let nextVideoSrc = "";

/**
 * Event Listeners
 */
elements["video-preview"]?.addEventListener("click", () => {
  startVideo();
});

function startVideo(): void {
  console.log(startVideo);
  const video = elements["video-container"];
  video.src = `hero-${currentVideo}.mp4`;
  video.load();
  video.play();
}
