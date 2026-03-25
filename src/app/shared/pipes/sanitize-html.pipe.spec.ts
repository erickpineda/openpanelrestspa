import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SanitizeHtmlPipe } from './sanitize-html.pipe';

describe('SanitizeHtmlPipe', () => {
  it('sanitiza HTML eliminando scripts', () => {
    TestBed.configureTestingModule({});
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SanitizeHtmlPipe(sanitizer);

    const input = '<p>ok</p><script>alert(1)</script>';
    const output = pipe.transform(input);
    expect(output).toContain('<p>ok</p>');
    expect(output).not.toContain('<script>');
  });
});

