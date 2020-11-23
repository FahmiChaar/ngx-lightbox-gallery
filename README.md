# NgxLightboxGallery

### Install the directive
> npm install ngx-lightbox-gallery

### Import
>Import NgxLightboxGalleryModule into your app.module or the module of your component (Lazy loading)
```ts
import { NgxLightboxGalleryModule } from 'ngx-lightbox-gallery';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgxLightboxGalleryModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
```

### Examples
- Without gallery
```html
<img src='image_path' lightbox>
```
- Gallery

>Add your images in a container with 'lightbox-gallery' class and the directive should collect all imgs with the [lightbox] attribute and build the gallery
```html
<div class="lightbox-gallery">
    <img src='image_path' lightbox>
    <div class="image-container">
        <img src='image_path' lightbox>
    </div>
    <img src='image_path'> <!-- Image not showed in gallery because it not have lightbox attribute -->
</div>
```
### Optional
> Add this to your global css file (app.component.css) to add loop cursor when you hover the lightbox image
```css
img[lightbox] {
    cursor: zoom-in
}
```
