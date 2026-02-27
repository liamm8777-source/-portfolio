# State Management Rules

## Default Choice
- Use Angular Signals for all state.

## When to Use RxJS
- HTTP streams
- WebSockets
- User events
- Interop with external libraries

## Rules
- Never mix signals and observables in the same state model.
- Signals live close to the consumer.
- Shared signals go in services.

## Forbidden
- NgRx / global stores unless explicitly requested.
