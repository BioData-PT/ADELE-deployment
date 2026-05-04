import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: any, type: 'resourceUrl' | 'url' = 'resourceUrl'): SafeResourceUrl | SafeUrl {
    if (type === 'resourceUrl') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(value);
    }
    if (type === 'url') {
      return this.sanitizer.bypassSecurityTrustUrl(value);
    }
    return value;
  }
}
