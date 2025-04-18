import { gsap } from "gsap";

const elements = {
  "video-current": document.querySelector(
    ".video-current video"
  ) as HTMLVideoElement,
  "video-preview": document.querySelector(
    ".video-preview video"
  ) as HTMLVideoElement,
  "invisible-video-preview": document.querySelector(
    ".video-preview video.invisible-preview"
  ) as HTMLVideoElement,
};

const videoLength = 4;
let currentVideo = 1;
let hasFinishedLoadingAnimation = true;

/**
 * Event Listeners
 */
elements["video-preview"]?.addEventListener("click", () => {
  if (!hasFinishedLoadingAnimation) return;
  startNextVideo();
});

/**
 * Loop through available video previews and use preview src to switch playing video
 */
function startNextVideo(): void {
  hasFinishedLoadingAnimation = false;
  // play video
  const currentVideoIndex = currentVideo % videoLength;
  const video = elements["video-current"];
  const videoPreview = elements["video-preview"];
  const invisibleVideoPreview = elements["invisible-video-preview"];
  // video.src = `hero-${currentVideoIndex + 1}.mp4`;
  // video.load();
  // video.play();
  invisibleVideoPreview.src = `hero-${currentVideoIndex + 1}.mp4`;
  invisibleVideoPreview.load();
  invisibleVideoPreview.play().then(() => {
    const tl = gsap.timeline();
    tl.to(invisibleVideoPreview, {
      visibility: "visible",
      opacity: 1,
      zIndex: 20,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 1.5,
      ease: "power3.out",
      onComplete: () => {
        hasFinishedLoadingAnimation = true;
      },
    });
    tl.set(invisibleVideoPreview, {
      visibility: "hidden",
      opacity: 1,
      zIndex: 5,
      width: "300px",
      height: "200px",
    });
  });

  // change video preview src to the next video
  videoPreview.src = `hero-${
    currentVideoIndex === 3 ? 1 : currentVideoIndex + 2
  }.mp4`;

  currentVideo = (currentVideoIndex % videoLength) + 1;
}
