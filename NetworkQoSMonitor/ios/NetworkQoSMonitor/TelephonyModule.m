#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TelephonyModule, NSObject)

RCT_EXTERN_METHOD(getCellularInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
