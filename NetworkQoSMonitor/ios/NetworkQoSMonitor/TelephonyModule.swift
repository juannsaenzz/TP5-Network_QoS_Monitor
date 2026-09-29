import Foundation
import CoreTelephony

@objc(TelephonyModule)
class TelephonyModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(getCellularInfo:rejecter:)
  func getCellularInfo(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let networkInfo = CTTelephonyNetworkInfo()
    
    var operatorName: String? = nil
    var cellNetworkType: String = "UNKNOWN"
    
    if let carriers = networkInfo.serviceSubscriberCellularProviders {
        if let carrier = carriers.values.first {
            operatorName = carrier.carrierName
        }
    }
    
    if #available(iOS 12.0, *) {
        if let radioAccessTechs = networkInfo.serviceCurrentRadioAccessTechnology {
            if let tech = radioAccessTechs.values.first {
                switch tech {
                case CTRadioAccessTechnologyLTE:
                    cellNetworkType = "LTE"
                case CTRadioAccessTechnologyWCDMA:
                    cellNetworkType = "WCDMA"
                case CTRadioAccessTechnologyEdge, CTRadioAccessTechnologyGPRS:
                    cellNetworkType = "GSM"
                default:
                    // En iOS 14.1+ existen CTRadioAccessTechnologyNR (5G)
                    if #available(iOS 14.1, *) {
                        if tech == CTRadioAccessTechnologyNR || tech == CTRadioAccessTechnologyNRNSA {
                            cellNetworkType = "5G"
                        }
                    }
                }
            }
        }
    }
    
    // NOTA ARQUITECTÓNICA: Apple no permite leer el RSSI crudo mediante APIs públicas (rechazo en App Store asegurado).
    // Para el TP, dejamos constancia de esta limitación de iOS y pasamos 0.
    let result: [String: Any] = [
        "operatorName": operatorName ?? NSNull(),
        "rssi": 0, 
        "cellNetworkType": cellNetworkType
    ]
    
    resolve(result)
  }
}
