const elements = {
  "video-container": document.querySelector(
    ".video-container video"
  ) as HTMLVideoElement,
  "video-preview": document.querySelector(
    ".video-preview video"
  ) as HTMLVideoElement,
};

const videoLength = 4;
let currentVideo = 1;

/**
 * Event Listeners
 */
elements["video-preview"]?.addEventListener("click", () => {
  startNextVideo();
});

/**
 * Loop through available video previews and use preview src to switch playing video
 */
function startNextVideo(): void {
  // play video
  const currentVideoIndex = currentVideo % videoLength;
  const video = elements["video-container"];
  const videoPreview = elements["video-preview"];
  video.src = `hero-${currentVideoIndex + 1}.mp4`;
  video.load();
  video.play();

  // change video preview src to the next video
  videoPreview.src = `hero-${
    currentVideoIndex === 3 ? 1 : currentVideoIndex + 2
  }.mp4`;

  currentVideo = (currentVideoIndex % videoLength) + 1;
}
