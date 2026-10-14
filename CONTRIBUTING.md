# Contributing

Keep source in `src/` and regenerate examples with `npm run build`. Add tests for observable behavior, especially gesture ownership, instance isolation, meter staleness and numeric conversions. Run `npm run check` before submitting a pull request. Include browser/device and Open Stage Control versions when reporting touch issues.

Do not include proprietary application source, user equipment settings, IP addresses, captures or credentials. Do not make automated tests control real equipment. Use the simulator or mocked adapters. New mixer support needs a documented parameter mapping and explicit hardware verification scope.
