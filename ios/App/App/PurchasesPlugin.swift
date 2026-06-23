// ios/App/App/PurchasesPlugin.swift
import Foundation
import Capacitor
import StoreKit

@objc(PurchasesPlugin)
public class PurchasesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PurchasesPlugin"
    public let jsName = "Purchases"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise),
    ]

    private let lifetimeId = "de.kittysort.app.lifetime"
    private var updatesTask: Task<Void, Never>?

    public override func load() {
        // Asynchrone Transaktionen (z. B. Ask-to-Buy-Freigabe) abfangen.
        updatesTask = Task.detached { [weak self] in
            for await update in Transaction.updates {
                if case .verified(let transaction) = update {
                    await transaction.finish()
                    self?.notifyListeners("entitlementChanged",
                                          data: ["productId": transaction.productID])
                }
            }
        }
    }

    deinit { updatesTask?.cancel() }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids", String.self), !ids.isEmpty else {
            call.reject("ids required"); return
        }
        Task {
            do {
                let products = try await Product.products(for: ids)
                let arr = products.map { p -> [String: String] in
                    ["id": p.id, "displayPrice": p.displayPrice, "displayName": p.displayName]
                }
                call.resolve(["products": arr])
            } catch {
                call.reject("getProducts failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId required"); return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else { call.reject("product not found"); return }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    if case .verified(let transaction) = verification {
                        await transaction.finish()
                        call.resolve(["status": "purchased", "productId": productId])
                    } else {
                        call.reject("verification failed")
                    }
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                case .pending:
                    call.resolve(["status": "pending"])
                @unknown default:
                    call.reject("unknown purchase result")
                }
            } catch {
                call.reject("purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            try? await AppStore.sync()
            let owned = await ownedProductIds()
            call.resolve(["lifetime": owned.contains(lifetimeId)])
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            let owned = await ownedProductIds()
            call.resolve(["lifetime": owned.contains(lifetimeId)])
        }
    }

    private func ownedProductIds() async -> Set<String> {
        var ids = Set<String>()
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                ids.insert(transaction.productID)
            }
        }
        return ids
    }
}
