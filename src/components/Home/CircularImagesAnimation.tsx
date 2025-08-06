import { useGSAP } from "@gsap/react";
import { useRef, useState, useEffect } from "react";
import gsap, { SplitText, ScrollTrigger } from "gsap/all";

// Define the shape of the collection array
interface CollectionItem {
  img: string;
  title: string;
}

// Placeholder collection array (replace with your actual data)
const collection: CollectionItem[] = [
  { img: "./images/img1.jpeg", title: "Image 1" },
  { img: "./images/img2.jpeg", title: "Image 2" },
  { img: "./images/img3.jpeg", title: "Image 3" },
  { img: "./images/img4.jpeg", title: "Image 4" },
  { img: "./images/img5.jpeg", title: "Image 5" },
  { img: "./images/img6.jpeg", title: "Image 6" },
  { img: "./images/img7.jpeg", title: "Image 7" },
  { img: "./images/img8.jpeg", title: "Image 8" },
  { img: "./images/img9.jpeg", title: "Image 9" },
  { img: "./images/img10.jpeg", title: "Image 10" },
  { img: "./images/img11.jpeg", title: "Image 11" },
  { img: "./images/img12.jpeg", title: "Image 12" },
  { img: "./images/img13.jpeg", title: "Image 13" },
];

// Define the shape of transformState objects
interface TransformState {
  currentRotation: number;
  targetRotation: number;
  currentX: number;
  targetX: number;
  currentY: number;
  targetY: number;
  currentScale: number;
  targetScale: number;
  angle: number;
}

// Define the shape of parallaxState
interface ParallaxState {
  targetX: number;
  targetY: number;
  targetZ: number;
  currentX: number;
  currentY: number;
  currentZ: number;
}

// Define the shape of config
interface Config {
  imageCount: number;
  radius: number;
  sensitivity: number;
  effectFalloff: number;
  cardMoveAmount: number;
  lerpFactor: number;
  isMobile: boolean;
}

const CircularImagesAnimation: React.FC = () => {
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const galleryContainerRef = useRef<HTMLDivElement | null>(null);
  const titleContainerRef = useRef<HTMLDivElement | null>(null);
  const clickToViewRef = useRef<HTMLDivElement | null>(null);

  // State to manage config and isMobile
  const [config, setConfig] = useState<Config>({
    imageCount: 13,
    radius: 275,
    sensitivity: 500,
    effectFalloff: 250,
    cardMoveAmount: 50,
    lerpFactor: 0.15,
    isMobile: window.innerWidth < 1000,
  });

  // Update isMobile and adjust radius on resize
  useEffect(() => {
    const handleResize = () => {
      setConfig((prev) => ({
        ...prev,
        isMobile: window.innerWidth < 1000,
        radius: window.innerWidth < 1000 ? 150 : 275,
      }));
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useGSAP(() => {
    gsap.registerPlugin(SplitText);
    gsap.registerPlugin(ScrollTrigger);

    // Set overflow-x to hidden globally
    document.body.style.overflowX = "hidden";

    const gallery = galleryRef.current;
    const galleryContainer = galleryContainerRef.current;
    const titleContainer = titleContainerRef.current;
    const clickToView = clickToViewRef.current;

    if (!gallery || !galleryContainer || !titleContainer || !clickToView) return;

    const cards: HTMLDivElement[] = [];
    const transformState: TransformState[] = [];
    const scrollTriggers: ScrollTrigger[] = [];

    let currentTitle: HTMLParagraphElement | null = null;
    let isPreviewActive: boolean = false;
    let isTransitioning: boolean = false;
    let isScrolling: boolean = false;
    let lastRotation: number = 0; // Store the last rotation applied in togglePreview

    const parallaxState: ParallaxState = {
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      currentX: 0,
      currentY: 0,
      currentZ: 0,
    };

    // Initially hide "Click to View"
    gsap.set(clickToView, { opacity: 0, y: 0 });

    // Create cards with image load check
    for (let i = 0; i < config.imageCount; i++) {
      const angle = (i / config.imageCount) * Math.PI * 2;
      const cardIndex = i % collection.length;

      const card = document.createElement("div");
      card.className = "card";
      card.dataset.index = i.toString();
      card.dataset.title = collection[cardIndex].title;

      const img = document.createElement("img");
      img.src = collection[cardIndex].img;
      img.onload = () => gsap.set(card, { opacity: 1 });
      card.appendChild(img);

      const maxX = config.isMobile ? window.innerWidth / 2 : window.innerWidth / 2;
      const maxY = config.isMobile ? window.innerHeight / 2 : window.innerHeight / 2;

      gsap.set(card, {
        x: gsap.utils.random(-maxX, maxX),
        y: gsap.utils.random(-maxY, maxY),
        rotation: gsap.utils.random(0, 360),
        scale: 0.5,
        opacity: 0,
        transformPerspective: config.isMobile ? 500 : 800,
        transformOrigin: "center center",
      });

      gallery.appendChild(card);
      cards.push(card);
      transformState.push({
        currentRotation: 0,
        targetRotation: 0,
        currentX: 0,
        targetX: 0,
        currentY: 0,
        targetY: 0,
        currentScale: 1,
        targetScale: 1,
        angle,
      });

      card.addEventListener("click", (e: MouseEvent) => {
        if (!isTransitioning && !isScrolling) {
          togglePreview(parseInt(card.dataset.index!));
          e.stopPropagation();
        }
      });
    }

    // Create GSAP timeline for initial animations
    const tl = gsap.timeline({
      onComplete: () => {
        animate();
      },
    });

    // Step 1: Fade in and shuffle
    tl.to(cards, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.out",
    });

    // Step 2: Move to horizontal line
    tl.to(
      cards,
      {
        x: (index: number) => (index - config.imageCount / 2) * 100,
        y: 0,
        rotation: 0,
        duration: 1,
        ease: "power3.inOut",
      },
      "-=0.3"
    );

    // Step 3: Transition to circular layout with stagger
    tl.to(cards, {
      x: (index: number) =>
        config.radius * Math.cos(transformState[index].angle),
      y: (index: number) =>
        config.radius * Math.sin(transformState[index].angle),
      rotation: (index: number) =>
        (transformState[index].angle * 180) / Math.PI + 90,
      duration: 1.5,
      stagger: 0.1,
      ease: "power4.inOut",
      onComplete: () => {
        gsap.to(clickToView, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: ".container2",
            pin: true,
            pinSpacing: config.isMobile ? false : true,
            start: config.isMobile ? "top top" : "1% top",
            end: config.isMobile ? "+=50%" : "+=1000",
            scrub: 2,
            onEnter: () => {
              isScrolling = true;
              gsap.to(clickToView, { opacity: 0, duration: 0.3, ease: "power1.out" });
              transformState.forEach((state) => {
                state.currentRotation = 0;
                state.targetRotation = 0;
                state.currentScale = 1;
                state.targetScale = 1;
                state.currentX = 0;
                state.targetX = 0;
                state.currentY = 0;
                state.targetY = 0;
              });
              Object.assign(parallaxState, {
                targetX: 0,
                targetY: 0,
                targetZ: 0,
                currentX: 0,
                currentY: 0,
                currentZ: 0,
              });
              gsap.set(galleryContainer, { rotateX: 0, rotateY: 0, rotation: 0 });
              cards.forEach((card) => gsap.set(card, { rotationY: 0, scale: 1 }));
            },
            onLeaveBack: () => {
              isScrolling = false;
              gsap.to(clickToView, { opacity: 1, duration: 0.3, ease: "power1.out" });
            },
            onUpdate: (self) => {
              if (self.progress === 0 && !isScrolling) {
                gsap.to(clickToView, { opacity: 1, duration: 0.3, ease: "power1.out" });
              }
            },
          },
        });

        scrollTl.to(
          galleryContainer,
          {
            scale: config.isMobile ? 10 : 4,
            y: config.isMobile ? "200%" : "120%",
          }
        );

        scrollTl.to(
          gallery,
          {
            rotate: config.isMobile ? 350 : 353,
          },
          0
        );

        // Store the ScrollTrigger instance
        scrollTriggers.push(scrollTl.scrollTrigger!);
      },
    });

    function togglePreview(index: number): void {
      if (isScrolling) return;
      isTransitioning = true;

      // Disable all ScrollTriggers and vertical body scroll
      scrollTriggers.forEach((trigger) => trigger.disable());
      document.body.style.overflowY = "hidden"; // Disable vertical scroll

      const angle = transformState[index].angle;
      const targetPosition = (Math.PI * 3) / 2;
      let rotationRadians = targetPosition - angle;

      if (rotationRadians > Math.PI) rotationRadians -= Math.PI * 2;
      else if (rotationRadians < -Math.PI) rotationRadians += Math.PI * 2;

      // Store the rotation applied
      lastRotation = (rotationRadians * 180) / Math.PI;

      transformState.forEach((state) => {
        state.currentRotation = state.targetRotation = 0;
        state.currentScale = state.targetScale = 1;
        state.currentX = state.targetX = state.currentY = state.targetY = 0;
      });

      if (isPreviewActive) {
        const currentRotation = (gsap.getProperty(gallery, "rotation") as number) || 0;
        const newRotation = currentRotation + (rotationRadians * 180) / Math.PI;
        gsap.to(gallery, {
          rotation: newRotation,
          duration: 1.25,
          ease: "power4.inOut",
          onComplete: () => {
            lastRotation = newRotation; // Update lastRotation for subsequent toggles
            isTransitioning = false;
          },
        });
      } else {
        isPreviewActive = true;
        gsap.to(clickToView, {
          opacity: 0,
          y: 50,
          duration: 0.5,
          ease: "power2.out",
        });

        gsap.to(gallery, {
          onStart: () => {
            cards.forEach((card, i) => {
              gsap.to(card, {
                x: config.radius * Math.cos(transformState[i].angle),
                y: config.radius * Math.sin(transformState[i].angle),
                rotationY: 0,
                scale: 1,
                duration: 1.25,
                ease: "power4.out",
              });
            });
          },
          scale: 5,
          y: 1300,
          rotation: lastRotation,
          duration: 2,
          ease: "power4.inOut",
          onComplete: () => {
            isTransitioning = false;
          },
        });
      }

      gsap.to(parallaxState, {
        currentX: 0,
        currentY: 0,
        currentZ: 0,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          gsap.set(galleryContainer, {
            rotateX: parallaxState.currentX,
            rotateY: parallaxState.currentY,
            rotation: parallaxState.currentZ,
            transformOrigin: "center center",
          });
        },
      });

      if (currentTitle) {
        const words = currentTitle.querySelectorAll(".word");
        gsap.to(words, {
          y: "-125%",
          duration: 0.5,
          stagger: 0.05,
          ease: "power4.out",
          onComplete: () => {
            currentTitle?.remove();
            currentTitle = null;
            const titleText = cards[index].dataset.title;
            const p = document.createElement("p");
            p.textContent = titleText || "";
            titleContainer!.appendChild(p);
            currentTitle = p;

            const splitText = new SplitText(p, { type: "words", wordsClass: "word" });
            const words = splitText.words;

            gsap.set(words, { y: "125%" });
            gsap.to(words, {
              y: "0%",
              duration: 0.75,
              stagger: 0.1,
              ease: "power4.out",
            });
          },
        });
      } else {
        const titleText = cards[index].dataset.title;
        const p = document.createElement("p");
        p.textContent = titleText || "";
        titleContainer!.appendChild(p);
        currentTitle = p;

        const splitText = new SplitText(p, { type: "words", wordsClass: "word" });
        const words = splitText.words;

        gsap.set(words, { y: "125%" });
        gsap.to(words, {
          y: "0%",
          duration: 0.75,
          delay: isPreviewActive ? 0 : 1.25,
          stagger: 0.1,
          ease: "power4.out",
        });
      }
    }

    function resetGallery(): void {
      if (isTransitioning || isScrolling) return;

      isTransitioning = true;

      // Re-enable all ScrollTriggers and restore vertical body scroll
      scrollTriggers.forEach((trigger) => trigger.enable());
      document.body.style.overflowY = "auto"; // Restore vertical scroll

      if (currentTitle) {
        const words = currentTitle.querySelectorAll(".word");
        gsap.to(words, {
          y: "-125%",
          duration: 0.75,
          delay: 0.5,
          stagger: 0.1,
          ease: "power4.out",
          onComplete: () => {
            currentTitle?.remove();
            currentTitle = null;
          },
        });
      }

      const viewportWidth = window.innerWidth;
      let galleryScale = 1;

      if (viewportWidth < 768) {
        galleryScale = 0.6;
      } else if (viewportWidth < 1200) {
        galleryScale = 0.8;
      }

      gsap.to(gallery, {
        scale: galleryScale,
        y: 0,
        x: 0,
        rotation: 0, // Animate back to 0 from current rotation
        duration: 2.5,
        ease: "power4.inOut",
        onComplete: () => {
          isPreviewActive = isTransitioning = false;
          lastRotation = 0; // Reset lastRotation
          Object.assign(parallaxState, {
            targetX: 0,
            targetY: 0,
            targetZ: 0,
            currentX: 0,
            currentY: 0,
            currentZ: 0,
          });
          gsap.to(clickToView, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          });
        },
      });
    }

    function handleResize(): void {
      const viewportWidth = window.innerWidth;
      setConfig((prev) => ({
        ...prev,
        isMobile: viewportWidth < 1000,
        radius: viewportWidth < 1000 ? 150 : 275,
      }));

      let galleryScale = 1;

      if (viewportWidth < 768) {
        galleryScale = 0.6;
      } else if (viewportWidth < 1200) {
        galleryScale = 0.8;
      }

      gsap.set(gallery, {
        scale: galleryScale,
      });

      if (!isPreviewActive) {
        parallaxState.targetX = 0;
        parallaxState.targetY = 0;
        parallaxState.targetZ = 0;
        parallaxState.currentX = 0;
        parallaxState.currentY = 0;
        parallaxState.currentZ = 0;

        transformState.forEach((state) => {
          state.targetRotation = 0;
          state.currentRotation = 0;
          state.targetScale = 1;
          state.currentScale = 1;
          state.targetX = 0;
          state.currentX = 0;
          state.targetY = 0;
          state.currentY = 0;
        });
      }
    }

    function handleMouseMove(e: MouseEvent): void {
      if (isPreviewActive || isTransitioning || config.isMobile || isScrolling) return;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const percentX = (e.clientX - centerX) / centerX;
      const percentY = (e.clientY - centerY) / centerY;

      parallaxState.targetY = percentX * 15;
      parallaxState.targetX = -percentY * 15;
      parallaxState.targetZ = (percentX + percentY) * 5;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.sensitivity && !config.isMobile) {
          const flipFactor = Math.max(0, 1 - distance / config.effectFalloff);
          const angle = transformState[index].angle;
          const moveAmount = config.cardMoveAmount * flipFactor;

          transformState[index].targetRotation = 180 * flipFactor;
          transformState[index].targetScale = 1 + 0.3 * flipFactor;
          transformState[index].targetX = moveAmount * Math.cos(angle);
          transformState[index].targetY = moveAmount * Math.sin(angle);
        } else {
          transformState[index].targetRotation = 0;
          transformState[index].targetScale = 1;
          transformState[index].targetX = 0;
          transformState[index].targetY = 0;
        }
      });
    }

    function handleMouseOut(e: MouseEvent): void {
      if (
        (e.relatedTarget === null ||
          (e.relatedTarget as Node).nodeName === "HTML") &&
        !isPreviewActive &&
        !isTransitioning &&
        !isScrolling
      ) {
        transformState.forEach((state) => {
          state.targetRotation = 0;
          state.targetScale = 1;
          state.targetX = 0;
          state.targetY = 0;
        });
        parallaxState.targetX = 0;
        parallaxState.targetY = 0;
        parallaxState.targetZ = 0;
      }
    }

    function animate(): void {
      if (!isPreviewActive && !isTransitioning) {
        if (!isScrolling) {
          parallaxState.currentX += (parallaxState.targetX - parallaxState.currentX) * config.lerpFactor;
          parallaxState.currentY += (parallaxState.targetY - parallaxState.currentY) * config.lerpFactor;
          parallaxState.currentZ += (parallaxState.targetZ - parallaxState.currentZ) * config.lerpFactor;

          cards.forEach((card, index) => {
            const state = transformState[index];
            state.currentRotation += (state.targetRotation - state.currentRotation) * config.lerpFactor;
            state.currentScale += (state.targetScale - state.currentScale) * config.lerpFactor;
            state.currentX += (state.targetX - state.currentX) * config.lerpFactor;
            state.currentY += (state.targetY - state.currentY) * config.lerpFactor;

            const angle = state.angle;
            const x = config.radius * Math.cos(angle);
            const y = config.radius * Math.sin(angle);

            gsap.set(card, {
              x: x + state.currentX,
              y: y + state.currentY,
              rotationY: state.currentRotation,
              scale: state.currentScale,
              rotation: (angle * 180) / Math.PI + 90,
              transformOrigin: "center center",
              transformPerspective: config.isMobile ? 500 : 800,
            });
          });
        } else {
          gsap.set(galleryContainer, {
            rotateX: 0,
            rotateY: 0,
            rotation: 0,
            transformOrigin: "center center",
          });
          cards.forEach((card, index) => {
            const state = transformState[index];
            const angle = state.angle;
            const x = config.radius * Math.cos(angle);
            const y = config.radius * Math.sin(angle);
            gsap.set(card, {
              x: x,
              y: y,
              rotationY: 0,
              scale: 1,
              rotation: (angle * 180) / Math.PI + 90,
              transformOrigin: "center center",
              transformPerspective: config.isMobile ? 500 : 800,
            });
          });
        }

        gsap.set(galleryContainer, {
          rotateX: parallaxState.currentX,
          rotateY: parallaxState.currentY,
          rotation: parallaxState.currentZ,
          transformOrigin: "center center",
        });
      }
      requestAnimationFrame(animate);
    }

    // Add event listeners
    window.addEventListener("resize", handleResize);
    document.addEventListener("click", () => {
      if (isPreviewActive && !isTransitioning && !isScrolling) resetGallery();
    });
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewActive && !isTransitioning && !isScrolling)
        resetGallery();
    });
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseout", handleMouseOut);

    // Initial setup
    handleResize();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", () => {});
      document.removeEventListener("keydown", () => {});
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseout", handleMouseOut);
      cards.forEach((card) => {
        card.removeEventListener("click", () => {});
      });
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      document.body.style.overflowX = "hidden"; // Ensure overflow-x remains hidden
      document.body.style.overflowY = "auto"; // Restore vertical scroll on unmount
    };
  }, []);

  return (
    <div className="container2 flex items-center justify-center min-h-screen relative" style={{ height: config.isMobile ? "100dvh" : "auto" }}>
      <div className="gallery-container" ref={galleryContainerRef}>
        <div className="gallery" ref={galleryRef}></div>
        <div
          className="click-to-view absolute text-center opacity-0"
          ref={clickToViewRef}
        >
          Click to View
        </div>
      </div>
      <div className="title-container" ref={titleContainerRef}></div>
    </div>
  );
};

export default CircularImagesAnimation;