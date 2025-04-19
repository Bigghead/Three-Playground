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
// - video gets zoomed in after ^ mis-sync
// - refactor
function startNextVideo(): void {
  hasFinishedLoadingAnimation = false;
  const currentVideoIndex = currentVideo % videoLength;
  const videoSrc = `hero-${currentVideoIndex + 1}.mp4`;
  const video = elements["video-current"];
  const videoPreview = elements["video-preview"];
  const invisibleVideoPreview = elements["invisible-video-preview"];

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
        swapVideo({
          video,
          videoSrc,
          invisibleVideoPreview,
          videoPreview,
          currentVideoIndex,
        });
      },
    });
  });
}

function swapVideo({
  video,
  videoSrc,
  invisibleVideoPreview,
  videoPreview,
  currentVideoIndex,
}: {
  video: HTMLVideoElement;
  videoSrc: string;
  invisibleVideoPreview: HTMLVideoElement;
  videoPreview: HTMLVideoElement;
  currentVideoIndex: number;
}): void {
  video.src = videoSrc;
  video.onloadeddata = async () => {
    video.currentTime = invisibleVideoPreview.currentTime;

    try {
      await video.play();
      hasFinishedLoadingAnimation = true;

      gsap.set(invisibleVideoPreview, {
        visibility: "hidden",
        opacity: 1,
        zIndex: 5,
        width: "300px",
        height: "200px",
        onComplete: () =>
          updatePreviewVideo({
            videoPreviewEl: videoPreview,
            videoSrc: `hero-${
              currentVideoIndex === 3 ? 1 : currentVideoIndex + 2
            }.mp4`,
            currentVideoIndex,
          }),
      });
    } catch (e) {
      console.error(e);
    }
  };
}

function updatePreviewVideo({
  videoPreviewEl,
  videoSrc,
  currentVideoIndex,
}: {
  videoSrc: string;
  videoPreviewEl: HTMLVideoElement;
  currentVideoIndex: number;
}): void {
  videoPreviewEl.src = videoSrc;
  currentVideo = (currentVideoIndex % videoLength) + 1;
}
