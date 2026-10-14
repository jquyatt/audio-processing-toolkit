# State and command contract

The factory returns native Open Stage Control widget definitions. All OSC messages below use the selected namespace (`/audio-processing/<id>` by default). State is one JSON string at `<namespace>/state`. Supply finite numeric values; send `known:false` / `editable:false` on stale state or disconnection. Replace state when changing channel. Never trust client data as authority for writes.

## EQ state

```json
{"channel":1,"known":true,"editable":true,"enabled":true,"sampleRate":48000,"bands":[{"known":true,"type":2,"frequency":1000,"gain":0,"q":1},{"known":true,"type":2,"frequency":2000,"gain":0,"q":1},{"known":true,"type":2,"frequency":4000,"gain":0,"q":1},{"known":true,"type":2,"frequency":8000,"gain":0,"q":1}]}
```

Exactly four bands. Frequency in Hz, gain in dB, Q unitless. Shapes follow X32 enum order: 0 low cut, 1 low shelf, 2 bell, 3 vintage bell (approximated), 4 high shelf, 5 high cut. Adapter clamps frequency to 20–20000 Hz, gain to −15…15 dB and Q to 0.3…10.

Optional `rta`: `{available:true, source:0, stamp:<epoch milliseconds>, frequencies:[100 positive Hz values], bins:[100 dBFS values]}`. The toolkit smooths supplied samples; it performs no FFT and never selects a mixer analyzer source itself.

Command: `<namespace>/point channel band frequency gain q`. Band is 1…4. Channel is captured at gesture start; lost editability/channel changes cancel the gesture. An adapter must verify that captured channel is still authorized.

## Dynamics state

Shared fields: `channel`, `kind` (`gate` or `comp`), `known`, `editable`, `enabled`, `settings`, `meter`, `history`.

Gate settings: `{threshold:-38, range:30, modeIndex:1}`. Threshold dB: −80…0; range dB: 3…60; modes 0=2:1, 1=3:1, 2=4:1, 3=Gate, 4=Duck.

Compressor settings: `{threshold:-24, ratio:4, knee:2, gain:3, mix:100}`. Threshold −60…0 dB; makeup gain 0…24 dB; mix 0…100 percent; knee X32 index 0…5 (modeled width index × 5 dB).

`meter`: `{inputDb:-20, gateReductionDb:6, compReductionDb:4}`. Input is dBFS; reductions are positive attenuation in dB. Each entry in `history` has the same fields plus `stamp` (epoch milliseconds). Supply chronological samples, keep approximately ten seconds, and clear history when meter data becomes stale. The widget clips older samples and breaks lines across missing values or gaps exceeding one second. Do not publish silence to stand in for unavailable meters.

Commands:

| Address suffix | Arguments |
| --- | --- |
| `/threshold` | captured channel, kind, threshold dB |
| `/ratio` | captured channel, kind, step index |
| `/value` | captured channel, `gateRange` or `compGain`, normalized value 0…1 |

Compressor ratio index order: `[1.1,1.3,1.5,2,2.5,3,4,5,7,10,20,100]`. Gate ratio index order: `[2:1,3:1,4:1,Gate]`. Value conversion: gate range = `3 + value × 57`; compressor makeup = `value × 24`. Adapters may reject unsupported parameters; do not silently treat these indices as booleans.

## Multiple instances

Instance IDs and namespaces must be unique within a session. EQ selection and RTA visibility variables are namespaced by ID. The example is intentionally a single synthetic channel; real adapters must also define ownership and conflict handling when multiple browser clients operate the same hardware channel.
