import { Directive, ElementRef, OnInit, HostListener, Renderer2, OnDestroy } from '@angular/core';
import * as Hammer from 'hammerjs';

function importModule(moduleName):Promise<any>{
  return new Promise(async (resolve)=> {
    try {
      const importedModule = await import(moduleName);
      console.log("\timported ...");
      resolve(importedModule)
    }catch(e) {
      // console.log('Import error', e)
      resolve(null)
    }
  })
}

const BACK_ICON = "<svg xmlns='http://www.w3.org/2000/svg' width='25px' viewBox='0 0 512 512'><title>Chevron Back</title><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M328 112L184 256l144 144'/></svg>"
const FORWARD_ICON = "<svg xmlns='http://www.w3.org/2000/svg' width='25px' viewBox='0 0 512 512'><title>Chevron Forward</title><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='48' d='M184 112l144 144-144 144'/></svg>"
const CLOSE_ICON = "<svg xmlns='http://www.w3.org/2000/svg' width='25px' viewBox='0 0 512 512'><title>Close</title><path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='32' d='M368 368L144 144M368 144L144 368'/></svg>"
const SPINNER = `<svg fill="#fff" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg"><circle cx="15" cy="15" r="15"><animate attributeName="r" begin="0s" calcMode="linear" dur="0.8s" from="15" repeatCount="indefinite" to="15" values="15;9;15"/><animate attributeName="fill-opacity" begin="0s" calcMode="linear" dur="0.8s" from="1" repeatCount="indefinite" to="1" values="1;.5;1"/></circle><circle cx="60" cy="15" r="9" fill-opacity=".3"><animate attributeName="r" begin="0s" calcMode="linear" dur="0.8s" from="9" repeatCount="indefinite" to="9" values="9;15;9"/><animate attributeName="fill-opacity" begin="0s" calcMode="linear" dur="0.8s" from="0.5" repeatCount="indefinite" to="0.5" values=".5;1;.5"/></circle><circle cx="105" cy="15" r="15"><animate attributeName="r" begin="0s" calcMode="linear" dur="0.8s" from="15" repeatCount="indefinite" to="15" values="15;9;15"/><animate attributeName="fill-opacity" begin="0s" calcMode="linear" dur="0.8s" from="1" repeatCount="indefinite" to="1" values="1;.5;1"/></circle></svg>`

const IMG_STYLE = `
  position: absolute;
  z-index: 1002;
  width: auto;
  height: auto;
  max-height: 100%;
  max-width: 100%;
  opacity: 0;
  transform: scale(0.5);
  background: #fff;
  transition: all 0.3s ease-in-out;
  user-drag: none;
  -webkit-user-drag: none;
  cursor: grab !important;
`

@Directive({
  selector: '[lightbox]' // Attribute selector
})
export class NgxLightboxGalleryDirective implements OnInit, OnDestroy {
  image: HTMLImageElement
  imageClone: HTMLImageElement
  activeImage: HTMLImageElement
  lightboxContainer: HTMLDivElement
  lightboxOverlay: HTMLDivElement
  lightboxCloseButton: HTMLDivElement
  lightboxSpinner: HTMLDivElement
  gallery: HTMLImageElement[]
  currentImageIndex: number = -1
  hardwareBackButtonSubscription
  ionicModule: any
  hammerManager: any
  constructor(
    private elementRef: ElementRef, 
    private render: Renderer2,
    // private platform: ionic.Platform
  ) {}

  async ngOnInit() {
    this.image = this.elementRef.nativeElement
    this.ionicModule = await importModule('@ionic/angular');
    console.log('IonicModule', this.ionicModule)
  }

  ngOnDestroy() {
    this.removeHardwareBackButtonListener()
  }

  handleHardwareBackButton() {
    if (this.ionicModule) {
      const platform = this.ionicModule.Platform
      this.hardwareBackButtonSubscription = platform.backButton.subscribeWithPriority(100, ()=> {
        this.close()
      })
    }
  }

  removeHardwareBackButtonListener() {
    if (this.hardwareBackButtonSubscription) {
      this.hardwareBackButtonSubscription.unsubscribe()
    }
  }

  @HostListener('click') onClick() {
    this.handleHardwareBackButton()
    this.imageClone = <HTMLImageElement>this.image.cloneNode()
    this.lightboxContainer = this.render.createElement('div')
    this.containerHammerSetup()
    this.render.setAttribute(this.lightboxContainer, 'style', `
      position: fixed;
      z-index: 1000;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 1;
      transition: all 0.3s ease-in-out;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      cursor: grab !important;
    `)
    this.render.setAttribute(this.imageClone, 'style', IMG_STYLE)
    this.render.appendChild(this.lightboxContainer, this.imageClone)
    
    this.createLightboxOverlay()
    this.createLightboxSpinner()
    this.createLightboxCloseButton()

    this.render.appendChild(document.body, this.lightboxContainer)
    setTimeout(() => {
      this.lightboxOverlay.style.opacity = '1'
    }, 50);

    this.imageClone.onload = (ev) => {
      this.toggleImage(this.imageClone, true)
      this.loadGallery()
      this.render.removeChild(this.lightboxContainer, this.lightboxSpinner)
    }

    this.render.listen(this.lightboxOverlay, 'click', ()=> this.close())
    this.render.listen(this.lightboxCloseButton, 'click', () => this.close())
  }

  private createLightboxSpinner() {
    this.lightboxSpinner = this.render.createElement('div')
    this.render.setAttribute(this.lightboxSpinner, 'style', `
      position: absolute;
      z-index: 1004;
      color: white;
      width: 50px;
    `)
    this.render.appendChild(this.lightboxContainer, this.lightboxSpinner)
    this.createSpinner()
  }

  private createSpinner() {
    const spinner: HTMLDivElement = this.render.createElement('div')
    this.render.appendChild(this.lightboxSpinner, spinner)
    spinner.outerHTML = SPINNER
  }

  private createLightboxCloseButton() {
    this.lightboxCloseButton = this.render.createElement('div') as HTMLDivElement
    this.render.appendChild(this.lightboxContainer, this.lightboxCloseButton)
    this.render.setAttribute(this.lightboxCloseButton, 'style', `
      position: absolute;
      z-index: 1003;
      cursor: pointer;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      background: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.3s ease-in-out;
    `)
    this.lightboxCloseButton.onmouseenter = ()=> this.lightboxCloseButton.style.opacity = '0.7'
    this.lightboxCloseButton.onmouseleave = ()=> this.lightboxCloseButton.style.opacity = '1'
    this.createCloseIcon()
  }

  private createCloseIcon() {
    const closeIcon: HTMLDivElement = this.render.createElement('div')
    this.render.appendChild(this.lightboxCloseButton, closeIcon)
    closeIcon.outerHTML = CLOSE_ICON
  }

  private createLightboxOverlay() {
    this.lightboxOverlay = this.render.createElement('div') as HTMLDivElement
    this.render.setAttribute(this.lightboxOverlay, 'style', `
      position: absolute;
      z-index: 1001;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      background: rgba(0,0,0,0.9);
      transition: all 0.3s ease-in-out;
    `)
    this.render.appendChild(this.lightboxContainer, this.lightboxOverlay)
  }

  private loadGallery() {
    const lightboxGallery = this.image.closest('.lightbox-gallery')
    if (!lightboxGallery) { return false }
    this.gallery = Array.from(lightboxGallery.querySelectorAll('img[lightbox]'))
    if (this.gallery.length > 1) {
      this.gallery = this.gallery.filter(img => img.src != this.image.src).map(img => {
        const clonedImg = img.cloneNode() as HTMLImageElement
        this.render.setAttribute(clonedImg, 'style', IMG_STYLE)
        this.render.setStyle(clonedImg, 'z-index', '1000')
        this.render.appendChild(this.lightboxContainer, clonedImg)
        return clonedImg
      })
      if (this.gallery.length > 0) {
        this.createNavigationButtons()
      }
    }
  }

  private createNavigationButtons() {
    const backIcon  = this.render.createElement('div')
    const forwardIcon = this.render.createElement('div')
    const iconStyle = `
      position: absolute;
      z-index: 1005;
      top: 50%;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `
    this.render.setAttribute(backIcon, 'style', iconStyle + 'left: 0;')
    this.render.setAttribute(forwardIcon, 'style', iconStyle + 'right: 0;')
    this.render.appendChild(this.lightboxContainer, backIcon)
    this.render.appendChild(this.lightboxContainer, forwardIcon)
    backIcon.innerHTML = BACK_ICON
    forwardIcon.innerHTML = FORWARD_ICON

    this.render.listen(backIcon, 'click', ()=> this.prevImage())
    this.render.listen(forwardIcon, 'click', () => this.nextImage())
  }

  public nextImage() {
    if (this.currentImageIndex == this.gallery.length - 1) {
      this.toggleImage(this.gallery[this.currentImageIndex], false)
      this.toggleImage(this.imageClone, true)
      this.currentImageIndex = -1
    }else {
      if (this.currentImageIndex == -1) {
        this.toggleImage(this.imageClone, false)
      }else {
        this.toggleImage(this.gallery[this.currentImageIndex], false)
      }
      this.currentImageIndex += 1
      this.toggleImage(this.gallery[this.currentImageIndex], true)
    }
  }

  public prevImage() {
    if (this.currentImageIndex == 0) {
      this.toggleImage(this.gallery[this.currentImageIndex], false)
      this.toggleImage(this.imageClone, true)
      this.currentImageIndex = -1
    }else {
      if (this.currentImageIndex == -1) {
        this.toggleImage(this.imageClone, false)
        this.currentImageIndex = this.gallery.length
      }else {
        this.toggleImage(this.gallery[this.currentImageIndex], false)
      }
      this.currentImageIndex -= 1
      this.toggleImage(this.gallery[this.currentImageIndex], true)
    }
  }

  private toggleImage(img, show = false) {
    if (show) {
      this.activeImage = img
      // this.imageHammerSetup()
    }
    this.render.setStyle(img, 'transition', 'all 0.3s ease-in-out')
    this.render.setStyle(img, 'transform', show ? 'scale(1)' : 'scale(0.5)')
    this.render.setStyle(img, 'opacity', show ? '1' : '0')
    this.render.setStyle(img, 'z-index', show ? '1002' : '1000')
  }

  containerHammerSetup() {
    const hammerOptions: HammerOptions = {
      recognizers: [
        [ Hammer.Pan, { threshold: 2, direction: Hammer.DIRECTION_VERTICAL }],
        [ Hammer.Swipe, { direction: Hammer.DIRECTION_ALL }],
      ]
    }
    const hammerManager = new Hammer.Manager(this.lightboxContainer, hammerOptions);
    hammerManager.on('panstart', ev => this.onContainerPanStart(ev))
    hammerManager.on('panmove', ev => this.onContainerPanMove(ev))
    hammerManager.on('panend pancancel', ev => this.onContainerPanEnd(ev))
    hammerManager.add(new Hammer.Swipe()).recognizeWith(hammerManager.get('pan'))
    hammerManager.on('swipe', ev => this.onContainerSwipe(ev))
  }
  
  // imageHammerSetup() {
  //   const hammerOptions: HammerOptions = {
  //     recognizers: [
  //       [ Hammer.Pan, { threshold: 2, direction: Hammer.DIRECTION_HORIZONTAL }],
  //       [ Hammer.Swipe, { threshold: 2, direction: Hammer.DIRECTION_ALL }],
  //     ]
  //   }
  //   const hammerManager = new Hammer.Manager(this.activeImage, hammerOptions);
  //   // hammerManager.on('panstart', ev => this.onImagePanStart(ev))
  //   // hammerManager.on('panmove', ev => this.onImagePanMove(ev))
  //   // hammerManager.on('panend pancancel', ev => this.onImagePanEnd(ev))
  //   hammerManager.add(new Hammer.Swipe()).recognizeWith(hammerManager.get('pan'))
  //   hammerManager.on('swipe', ev => this.onContainerSwipe(ev))
  // }

  onContainerPanStart(ev) {
    this.render.setStyle(this.activeImage, 'transition', 'none')
    this.render.setStyle(this.lightboxContainer, 'transition', 'none')
  }

  onContainerPanMove(ev) {
    if (ev.direction === Hammer.DIRECTION_UP || ev.direction === Hammer.DIRECTION_DOWN) {
      this.render.setStyle(this.activeImage, 'transform', `translate3d(0,${ev.deltaY}px,0)`)
      const limit = (window.innerHeight / 4)
      const opacity = (1 - (Math.abs(ev.deltaY)/limit))
      this.render.setStyle(this.lightboxContainer, 'opacity', `${opacity}`)
    }else if (ev.direction === Hammer.DIRECTION_RIGHT || ev.direction === Hammer.DIRECTION_LEFT) {
      
    }
  }

  onContainerPanEnd(ev) {
    this.render.setStyle(this.activeImage, 'transition', 'all 0.3s ease-in-out')
    this.render.setStyle(this.lightboxContainer, 'transition', 'all 0.3s ease-in-out')
    // const imageBounding = this.activeImage.getBoundingClientRect()
    // const imageMiddlePosition = imageBounding.y + (imageBounding.height / 2)
    const windowHalf = (window.innerHeight / 2)
    if (Math.abs(ev.deltaY) < (windowHalf / 2)) {
      this.render.setStyle(this.activeImage, 'transform', `translate3d(0,0,0)`)
      this.render.setStyle(this.lightboxContainer, 'opacity', `1`)
    }else {
      this.close()
    }
  }

  onContainerSwipe(ev) {
    if (ev.direction === Hammer.DIRECTION_UP || ev.direction === Hammer.DIRECTION_DOWN) {
      this.close()
    }else if (ev.direction === Hammer.DIRECTION_LEFT) {
      this.prevImage()
    }else if (ev.direction === Hammer.DIRECTION_RIGHT) {
      this.nextImage()
    }
  }

  // Image gesture
  // onImagePanStart(ev) {
  //   this.render.setStyle(this.activeImage, 'transition', 'none')
  // }

  // onImagePanMove(ev) {
  //   if (ev.direction === Hammer.DIRECTION_LEFT || ev.direction === Hammer.DIRECTION_RIGHT) {
  //     const limit = (window.innerWidth / 4)
  //     const scale = (1 - (Math.abs(ev.deltaX)/limit))
  //     console.log(scale)
  //     if (scale > 0.4) {
  //       this.render.setStyle(this.activeImage, 'transform', `scale(${scale})`)
  //       this.render.setStyle(this.activeImage, 'opacity', `${scale}`)
  //     }
  //   }
  // }

  // onImagePanEnd(ev) {
  //   this.render.setStyle(this.activeImage, 'transition', 'all 0.3s ease-in-out')
  //   const limit = (window.innerWidth / 4)
  //   const scale = (1 - (Math.abs(ev.deltaX)/limit))
  //   const windowWidthHalf = (window.innerHeight / 2)
  //   if (scale >= 0.5) {
  //     this.render.setStyle(this.activeImage, 'transform', `scale(1)`)
  //     this.render.setStyle(this.activeImage, 'opacity', `1`)
  //   }else {
  //     if (ev.direction === Hammer.DIRECTION_LEFT) {
  //       this.prevImage()
  //     }else if (ev.direction === Hammer.DIRECTION_RIGHT) {
  //       this.nextImage()
  //     }
  //   }
  // }

  // onImageSwipe(ev) {
  //   console.log(ev.direction)
  // }

  close() {
    const currentImg = this.currentImageIndex == -1 ? this.imageClone : this.gallery[this.currentImageIndex]
    this.toggleImage(currentImg, false)
    this.render.setStyle(this.lightboxOverlay, 'opacity', '0')
    setTimeout(() => {
      this.removeHardwareBackButtonListener()
      this.render.removeChild(document.body, this.lightboxContainer)
    }, 300);
  }

}
