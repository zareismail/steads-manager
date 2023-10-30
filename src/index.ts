import ProxyToGate from '@steads/proxy-to-gate';
import camelcase from 'camelcase';

export default abstract class Manager<T, D extends T = T> extends ProxyToGate {
  /**
   * Cache of initiated drivers.
   */
  protected drivers: { [key: string]: T } = {};

  /**
   * Get the driver instance.
   */
  driver<D extends T = T>(driver?: string): D {
    return this.resolveDriver<D>(driver ?? this.getDefaultDriver());
  }

  /**
   * Get name of the default driver.
   */
  abstract getDefaultDriver(): string;

  /**
   * Resolve the driver instance.
   */
  protected resolveDriver<D extends T = T>(driver: string): D {
    // cache driver if not initiated yet
    if (this.drivers[driver] === undefined) {
      this.drivers[driver] = this.createDriver(driver);
    }
    return this.drivers[driver] as unknown as D;
  }

  /**
   * Create new driver instance
   */
  protected createDriver(driver: string): T {
    const callback = this.driverCallback(driver) as keyof this;

    if (typeof this[callback] !== 'function') {
      throw new Error(`Creator method not found for driver '${driver}'.`);
    }
    return (this[callback] as Function)();
  }

  /**
   * Guess driver callback.
   */
  protected driverCallback(driver: string): string {
    return `create${camelcase(driver, { pascalCase: true })}Driver`;
  }

  /**
   * Proxy unhandled method and properties.
   */
  protected __call(property: string | symbol): () => any {
    return (...args) => {
      const driver: D = this.driver();
      const unhandled = driver[property as keyof D];

      return typeof unhandled === 'function'
        ? unhandled.apply(driver, args)
        : unhandled;
    };
  }
}
