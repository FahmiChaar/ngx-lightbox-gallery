import { TestBed } from '@angular/core/testing';

import { NgxLightboxGalleryDirective } from './ngx-lightbox-gallery.directive';

describe('NgxLightboxGalleryDirective', () => {
  let service: NgxLightboxGalleryDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxLightboxGalleryDirective);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
