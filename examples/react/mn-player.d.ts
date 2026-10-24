import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { AccentName, MakeNoisePlayerElement } from 'makenoise/elements';

/** Attributes of `<mn-player>`, see the README. Boolean attributes are set when `true`. */
interface MnPlayerAttributes extends DetailedHTMLProps<HTMLAttributes<MakeNoisePlayerElement>, MakeNoisePlayerElement> {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  theme?: 'auto' | 'light' | 'dark';
  accent?: AccentName;
  artwork?: boolean;
  quiet?: boolean;
  'always-visible'?: boolean;
  'no-font-download'?: boolean;
  'no-color-picker'?: boolean;
  keyboard?: boolean | 'focus' | 'global';
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'mn-player': MnPlayerAttributes;
    }
  }
}
