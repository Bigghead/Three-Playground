import { gsap } from "gsap";

const elements = {
  "video-preview-container": document.querySelector(
    ".video-preview-container"
  ) as HTMLDivElement,
  "video-current": document.querySelector(
    ".video-current video"
  ) as HTMLVideoElement,
  "video-preview": document.querySelector(
    ".video-preview-container video.video-preview"
  ) as HTMLVideoElement,
};

const tl = gsap.timeline();
const videoLength = 4;
const videoPreview = elements["video-preview"];

let currentVideo = 1;
let hasPlayedOnce = false;
let hasPreviewShowing = false;

// this is new, gsap has an animation loop you can track and kill process of
let expandTween: gsap.core.Tween | null = null;
let shrinkTween: gsap.core.Tween | null = null;
let shrinkTimer: gsap.core.Tween | null = null;

// cant click while gsap is doing its thing
let hasFinishedLoadingAnimation = true;

/**
 * Event Listeners
 */
elements["video-current"].addEventListener("canplaythrough", (e) => {
  const video = e.currentTarget as HTMLVideoElement;
  video.play();
});
elements["video-preview"]?.addEventListener("click", () => {
  if (!hasFinishedLoadingAnimation) return;
  startNextVideo();
});

document.addEventListener("mousemove", () => {
  // on mousemove, kill every animation process of the expanding preview
  if (expandTween) {
    expandTween.kill();
    expandTween = null;
  }
  if (shrinkTimer) {
    shrinkTimer.kill();
    shrinkTimer = null;
  }
  if (shrinkTween) {
    shrinkTween.kill();
    shrinkTween = null;
  }

  if (!hasPreviewShowing) {
    expandPreview();
  } else {
    restartShrinkTimer();
  }
});

function expandPreview() {
  expandTween = gsap.to(videoPreview, {
    duration: 0.5,
    width: "300px",
    height: "200px",
    opacity: 1,
    // zIndex: 10,
    onComplete: () => {
      hasPreviewShowing = true;
      startShrinkTimer();
    },
  });
}

/**
 * Starts a delayed timer that will trigger the preview video to shrink after 3 seconds.
 * If called again without clearing, multiple shrink timers could stack.
 */
function startShrinkTimer() {
  shrinkTimer = gsap.delayedCall(5, () => {
    shrinkPreview();
  });
}

/**
 * Restarts the shrink timer by killing the existing one (if any) and starting a new 3-second delay.
 * Prevents multiple timers from overlapping.
 */
function restartShrinkTimer() {
  if (shrinkTimer) {
    shrinkTimer.kill();
  }
  startShrinkTimer();
}

/**
 * Animates the preview video element to shrink to 0 size and fade out.
 * Once the animation completes, updates the preview visibility state.
 */
function shrinkPreview() {
  shrinkTween = gsap.to(videoPreview, {
    duration: 0.5,
    width: "0px",
    height: "0px",
    opacity: 0,
    onComplete: () => {
      hasPreviewShowing = false;
      shrinkTween = null;
    },
  });
}

/**
 * Starts the transition to the next video.
 *
 * This function prepares the invisible preview video with the next source,
 * plays it, and animates it expanding to fullscreen.
 * Once the animation completes, it removes the previous fullscreen video from html
 * and recreates a new invisible preview video for the next click event
 *
 * Guards against multiple clicks while the animation is running.
 */

// Todo
// - refactor
function startNextVideo(): void {
  hasFinishedLoadingAnimation = false;
  const currentVideoIndex = currentVideo % videoLength;
  const videoSrc = `hero-${currentVideoIndex + 1}.mp4`;
  const video = elements["video-current"];
  const videoPreview = elements["video-preview"];

  // Need this one to be queried everytime since we're dynamically re-creating a new one later
  const invisibleVideoPreview = document.querySelector(
    ".video-preview-container video.invisible-preview:last-child"
  ) as HTMLVideoElement;

  invisibleVideoPreview.style.zIndex = "25";

  video.pause();
  invisibleVideoPreview.src = videoSrc;

  invisibleVideoPreview.load();

  invisibleVideoPreview.play().then(() => {
    // need this set asap since the aniamtion duration takes 1.5s and will show the overlaid preview in the back
    tl.to(invisibleVideoPreview, {
      visibility: "visible",
      opacity: 1,
      zIndex: 20,
      width: window.innerWidth,
      height: window.innerHeight,
      duration: 1,
      ease: "power3.out",
      onComplete: () => {
        // we start off the page load with a full screen autoplay video
        // remove this on preview click, cause then we want our video creation loop to pick up
        if (hasPlayedOnce) {
          removeBackgroundVideo();
        }
        createInvisiblePreview(
          `hero-${currentVideoIndex === 3 ? 1 : currentVideoIndex + 2}.mp4`
        );
        updatePreviewVideo({
          videoPreviewEl: videoPreview,
          videoSrc: `hero-${
            currentVideoIndex === 3 ? 1 : currentVideoIndex + 2
          }.mp4`,
          currentVideoIndex,
        });
      },
    });
    tl.to(invisibleVideoPreview, {
      duration: 0.5,
      zIndex: 8,
      onComplete: () => {
        hasFinishedLoadingAnimation = true;
        hasPlayedOnce = true;
      },
    });
    // tl.to(videoPreview, {
    //   duration: 0.5,
    //   opacity: 0.4,
    // });
  });
}

/**
 * Updates the preview video element with a new video source
 * and updates the current video index.
 *
 * @param {Object} params - Parameters object.
 * @param {HTMLVideoElement} params.videoPreviewEl - The video element used for preview.
 * @param {string} params.videoSrc - The source URL for the next preview video.
 * @param {number} params.currentVideoIndex - The current index of the video.
 */
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

/**
 * Removes the first invisible preview video element
 * from the DOM if it exists.
 */
function removeBackgroundVideo(): void {
  const videoElement = document.querySelectorAll(".invisible-preview")[0];
  console.log(videoElement);
  videoElement.remove();
}

/**
 * Creates a new invisible preview video element,
 * configures it, and appends it to the preview container.
 *
 * @param {string} videoSrc - The source URL for the invisible preview video.
 */
function createInvisiblePreview(videoSrc: string): void {
  const newVideoPreview = document.createElement("video");
  newVideoPreview.src = videoSrc;
  newVideoPreview.autoplay = true;
  newVideoPreview.loop = true;
  newVideoPreview.muted = true;
  newVideoPreview.preload = "auto";
  newVideoPreview.className = "invisible-preview";
  newVideoPreview.addEventListener("click", () => startNextVideo);

  elements["video-preview-container"].appendChild(newVideoPreview);
}
