/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'tests/mobile/detox/jest.config.js'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/tests/mobile/detox/setup.js']
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/CuadernoCampoGPS.app',
      build: 'cd apps/mobile && npx expo run:ios --configuration Debug --scheme CuadernoCampoGPS'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/CuadernoCampoGPS.app',
      build: 'cd apps/mobile && npx expo run:ios --configuration Release --scheme CuadernoCampoGPS'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd apps/mobile && npx expo run:android --variant debug'
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd apps/mobile && npx expo run:android --variant release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34'
      }
    },
    genymotion: {
      type: 'android.genycloud',
      device: {
        recipeUUID: 'e20fd492-055d-4f83-b8b9-f2f5b8b0fb5c'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    },
    'android.attached.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.attached.release': {
      device: 'attached',
      app: 'android.release'
    }
  }
};