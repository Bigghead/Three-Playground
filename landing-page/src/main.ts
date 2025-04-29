import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const elements = {
  "landing-hero": document.querySelector(".landing-hero") as HTMLDivElement,
  "video-container": document.querySelector(
    ".video-container"
  ) as HTMLDivElement,
  "video-preview-container": document.querySelector(
    ".video-preview-container"
  ) as HTMLDivElement,
  "video-current": document.querySelector(
    ".video-current video"
  ) as HTMLVideoElement,
  "video-preview": document.querySelector(
    ".video-preview-container video.video-preview"
  ) as HTMLVideoElement,
  "hero-text-special": document.querySelectorAll(
    ".hero-text__special h2"
  ) as NodeListOf<HTMLHeadingElement>,
};

const heroTextContents = ["Gaming", "Identity", "Reality", "Immersion"];

const tl = gsap.timeline();
const videoLength = 4;
let currentVideo = 1;
let hasPlayedOnce = false;

const heroText = elements["hero-text-special"];

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
// - refactor ( getting kinda big in animations )
function startNextVideo(): void {
  hasFinishedLoadingAnimation = false;
  const currentVideoIndex = currentVideo % videoLength;
  const videoSrc = `hero-${currentVideoIndex + 1}.mp4`;
  const nextVideoSrc = `hero-${
    currentVideoIndex === 3 ? 1 : currentVideoIndex + 2
  }.mp4`;
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
    animateSwapVideo({
      videoPreview,
      invisibleVideoPreview,
      currentVideoIndex,
      nextVideoSrc,
    });
    animateHeroText(currentVideoIndex);
  });
}

/**
 * Animates the transition between two video previews by fading in an invisible preview
 * and swapping the video source after the animation completes.
 *
 * @param {Object} params - The parameters for the video swap animation.
 * @param {HTMLVideoElement} params.videoPreview - The currently visible video preview element.
 * @param {HTMLVideoElement} params.invisibleVideoPreview - The invisible video preview element used for smooth transitions.
 * @param {number} params.currentVideoIndex - The index of the current video in the video list.
 * @param {string} params.nextVideoSrc - The source URL of the next video to play.
 *
 * @returns {void}
 */
function animateSwapVideo({
  videoPreview,
  invisibleVideoPreview,
  currentVideoIndex,
  nextVideoSrc,
}: {
  videoPreview: HTMLVideoElement;
  invisibleVideoPreview: HTMLVideoElement;
  currentVideoIndex: number;
  nextVideoSrc: string;
}): void {
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
      createInvisiblePreview(nextVideoSrc);
      updatePreviewVideo({
        videoPreviewEl: videoPreview,
        videoSrc: nextVideoSrc,
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
  // remove default 1st page load autoplay video
  if (elements["video-current"]) {
    elements["video-current"].remove();
  }
  const videoElement = document.querySelectorAll(".invisible-preview")[0];
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

/**
 * Moves Hero text scaled in to 0 to bottom right of screen
 * Restarts animation with new text populated
 *
 * @param {number} currentVideoIndex - Index of next text content to render
 */
function animateHeroText(currentVideoIndex: number): void {
  gsap.set(heroText, {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    scaleX: 1,
    transformOrigin: "center center",
  });
  gsap.to(heroText, {
    duration: 1,
    opacity: 0,
    x: 100,
    y: 100,
    scale: 0.5,
    ease: "power2.out",
    onComplete: () => {
      gsap.set(heroText, {
        x: -50,
        y: 0,
        scale: 1,
        scaleX: 0,
        opacity: 0,
        transformOrigin: "left center",
        onComplete: () => {
          heroText.forEach((text) => {
            text.textContent = heroTextContents[currentVideoIndex];
          });
        },
      });

      // Animate left-to-right reveal
      gsap.to(heroText, {
        duration: 1.2,
        opacity: 1,
        x: 0,
        scaleX: 1,
        ease: "power2.out",
      });
    },
  });
}

(function animateHeroPath() {
  gsap.set(elements["video-container"], {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    borderRadius: "0% 0% 0% 0%",
  });

  gsap.to(elements["video-container"], {
    clipPath: "polygon(14% 0, 72% 0, 88% 90%, 0 95%)",
    borderRadius: "0% 0% 40% 10%",
    ease: "power1.inOut",
    scrollTrigger: {
      trigger: elements["video-container"],
      start: "center center",
      end: "bottom center",
      scrub: true,
    },
  });
})();
