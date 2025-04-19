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

// cant click while gsap is doing its thing
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

// Todo
// - Fix mismatched videos' currenttime sync
// - refactor
function startNextVideo(): void {
  hasFinishedLoadingAnimation = false;
  const tl = gsap.timeline();
  const currentVideoIndex = currentVideo % videoLength;
  console.log(currentVideoIndex);
  const videoSrc = `hero-${currentVideoIndex + 1}.mp4`;
  const video = elements["video-current"];
  const videoPreview = elements["video-preview"];
  const invisibleVideoPreview = elements["invisible-video-preview"];

  tl.set(videoPreview, { visibility: "hidden" });
  invisibleVideoPreview.src = videoSrc;

  invisibleVideoPreview.load();

  invisibleVideoPreview.play().then(() => {
    const tl = gsap.timeline();

    // need this set asap since the aniamtion duration takes 1.5s and will show the overlaid preview in the back
    tl.to(invisibleVideoPreview, {
      visibility: "visible",
      opacity: 1,
      zIndex: 20,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 1.5,
      ease: "power3.out",
      onComplete: () => {
        video.src = videoSrc;
        video.onloadeddata = () => {
          video.currentTime = invisibleVideoPreview.currentTime;
          video.play().then(() => {
            hasFinishedLoadingAnimation = true;
            gsap.set(invisibleVideoPreview, {
              visibility: "hidden",
              opacity: 1,
              zIndex: 5,
              width: "300px",
              height: "200px",
            });
          });
        };
      },
    }).set(videoPreview, { visibility: "visible" });
  });

  // change video preview src to the next video
  videoPreview.src = `hero-${
    currentVideoIndex === 3 ? 1 : currentVideoIndex + 2
  }.mp4`;

  currentVideo = (currentVideoIndex % videoLength) + 1;
}
