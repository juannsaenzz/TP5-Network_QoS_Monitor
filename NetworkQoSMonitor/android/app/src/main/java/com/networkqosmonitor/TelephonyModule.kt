package com.networkqosmonitor

import android.content.Context
import android.telephony.TelephonyManager
import android.telephony.CellInfo
import android.telephony.CellInfoGsm
import android.telephony.CellInfoLte
import android.telephony.CellInfoWcdma
import android.telephony.CellInfoCdma
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class TelephonyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "TelephonyModule"
    }

    @ReactMethod
    fun getCellularInfo(promise: Promise) {
        try {
            val telephonyManager = reactApplicationContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            val map: WritableMap = Arguments.createMap()
            
            map.putString("operatorName", telephonyManager.networkOperatorName)
            
            var rssi = 0
            var networkType = "UNKNOWN"
            
            try {
                // Cuidado: allCellInfo requiere permisos de ubicación en runtime (ACCESS_FINE_LOCATION)
                val allCellInfo = telephonyManager.allCellInfo
                if (allCellInfo != null && allCellInfo.isNotEmpty()) {
                    // Tomamos la antena principal (la primera registrada)
                    val cellInfo = allCellInfo[0]
                    
                    if (cellInfo is CellInfoLte) {
                        rssi = cellInfo.cellSignalStrength.dbm
                        networkType = "LTE"
                    } else if (cellInfo is CellInfoGsm) {
                        rssi = cellInfo.cellSignalStrength.dbm
                        networkType = "GSM"
                    } else if (cellInfo is CellInfoWcdma) {
                        rssi = cellInfo.cellSignalStrength.dbm
                        networkType = "WCDMA"
                    } else if (cellInfo is CellInfoCdma) {
                        rssi = cellInfo.cellSignalStrength.dbm
                        networkType = "CDMA"
                    }
                }
            } catch (e: SecurityException) {
                map.putString("error", "Falta permiso de GPS en runtime para leer celdas")
            }
            
            map.putInt("rssi", rssi)
            map.putString("cellNetworkType", networkType)
            
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("TELEPHONY_ERROR", e.message)
        }
    }
}
