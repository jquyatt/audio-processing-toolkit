# Audio Processing Toolkit

Touch EQ and dynamics **control widgets for Open Stage Control**. This toolkit displays settings, emits control messages, and visualizes supplied meters. It does **not** process audio.

Experimental v0.1.0. Built and checked with Open Stage Control 1.31.1. The original controls were exercised in Safari on macOS and on a physical iPad; this extracted package has its own simulator and isolation tests. Other browsers, operating systems, mixer models and concurrent operators need verification.

## Included

- Four-band EQ response with draggable points, hold-and-pinch Q, wheel Q, and an optional supplied RTA overlay.
- Separate Gate and Compressor widgets, each combining its transfer curve with ten seconds of supplied input and gain-reduction history.
- Circle handles for threshold, ratio, compressor makeup and gate range. Drag down or pinch together for stronger dynamics ratios; drag up or spread for gentler ratios.
- Factories that generate importable Open Stage Control widgets with independent IDs and address namespaces.
- Hardware-free demo, configuration contracts and tests. No runtime npm dependencies.

## Try it without equipment

Download a tagged release or clone this repository. Install Open Stage Control separately from its official site: https://openstagecontrol.ammd.net/ . Node 22 or newer is needed only for building/testing the toolkit; the prebuilt session can be loaded directly.

In the Open Stage Control launcher:

1. Load `examples/session.json`.
2. Set **custom-module** to the absolute path of `examples/simulator.js`.
3. Use unused ports, for example server `16640` and OSC `16642`. Set **send** to `127.0.0.1:16642` (a local dummy target, required for the custom module to intercept control messages).
4. Start and open the displayed browser address.

The simulator owns no network connection and consumes all outgoing messages. The displayed RTA, signal history and GR are synthetic. Use a separate Open Stage Control process from a production mixer session.

Equivalent CLI (replace the executable and absolute paths for your installation):

```sh
open-stage-control --no-gui --port 16640 --osc-port 16642 --send 127.0.0.1:16642 \
  --load /absolute/path/audio-processing-toolkit/examples/session.json \
  --custom-module /absolute/path/audio-processing-toolkit/examples/simulator.js
```

## Add controls to your own layout

```js
import {createEq, createDynamics} from './src/widgets.mjs';
const eq = createEq({id: 'vocal_eq'});
const compressor = createDynamics({id: 'vocal_comp', kind: 'comp'});
const gate = createDynamics({id: 'vocal_gate', kind: 'gate'});
// Insert returned objects into a panel's widgets array, then save your session JSON.
```

Give every instance a unique `id`. Its state address defaults to `/audio-processing/<id>/state`; a custom `namespace` is supported. Send JSON state to that address and adapt the emitted commands to your mixer. See [BINDINGS.md](BINDINGS.md) for exact fields, units and message arguments.

Copying a generated widget without changing all child IDs is not safe. Generate a new instance instead. Widgets alone do not connect to an X32 or any other hardware. Your adapter must validate values, enforce write permissions and handle disconnection; an `editable` display flag is not an authorization boundary.

## Appearance

Native panel geometry, labels and surrounding controls are editable in Open Stage Control. Factory `height` sets graph height. Factory `theme` accepts six-digit hex overrides for `background`, `grid`, `text`, `muted`, `curve`, `threshold`, `ratio`, `secondary` and `combined`. For example:

```js
createDynamics({id:'vocal_comp', theme:{background:'#182028', curve:'#80d8ff'}});
```

RTA/input/GR history colors and some reference lines remain fixed in this release. Edit the corresponding draw scripts if you need full styling control.

## Development

```sh
npm test
npm run build       # rebuild examples from source
npm run check       # both
npm pack --dry-run  # inspect distributable files
```

Edit `src/`, never the embedded scripts in generated `examples/session.json`. Commit source and regenerated examples together. CI checks Node 22 and 24, verifies generated files, and builds a downloadable package. Releases attach that package for users who prefer a ZIP/tarball-style installation.

## Model and scope limits

EQ uses independently implemented W3C Audio EQ Cookbook biquads at the supplied sample rate. Vintage bell and mixer-specific filters are approximations. Dynamics are static curve models, not simulations of detector/envelope timing or exact hardware DSP. The plotted current output marker is modeled, not a measured output sample. Input and GR histories show whatever the adapter supplies.

Parameter types, ranges and ratio steps initially follow X32-style semantics. Gate provides 2:1, 3:1, 4:1 and Gate; Duck can be displayed but pinch does not enter Duck. A different mixer needs an explicit mapping. No routing, sidechain, headamp, phantom power, audio engine or full mixer application is included.

## License and attribution

GPL-3.0-or-later; see [LICENSE](LICENSE) and [NOTICE](NOTICE). Independently written controls using Open Stage Control's public scripting API. No Mixing Station decompiled code, proprietary assets, equipment addresses or live captures are included.
