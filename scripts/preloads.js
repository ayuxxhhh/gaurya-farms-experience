
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.Db3KX98s.js","/cdn/shopifycloud/checkout-web/assets/c1/app.yY7xOsFL.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor.Bgl2G-M6.js","/cdn/shopifycloud/checkout-web/assets/c1/context-browser.BEbgIMeu.js","/cdn/shopifycloud/checkout-web/assets/c1/checkout-policy.DmT0Prgr.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors.B5snikRB.js","/cdn/shopifycloud/checkout-web/assets/c1/types-ShopPayInstallments.3QzLmCoD.js","/cdn/shopifycloud/checkout-web/assets/c1/receipt-mapper-load-recovery.CXz2z2o8.js","/cdn/shopifycloud/checkout-web/assets/c1/receipt-eager-mappers.DcNvEz26.js","/cdn/shopifycloud/checkout-web/assets/c1/consent-manager-shared.BfV1fkT3.js","/cdn/shopifycloud/checkout-web/assets/c1/sections-shared.DGTFKGTG.js","/cdn/shopifycloud/checkout-web/assets/c1/error-logger-report-graphql-error.B33LP8U9.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-normalizeBuyerDetails.jaSUu9uf.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-derivations.8l3Ez2Qv.js","/cdn/shopifycloud/checkout-web/assets/c1/cvv-cvvBridge.BazRsLQT.js","/cdn/shopifycloud/checkout-web/assets/c1/PayButton-helpers.R2rD5on-.js","/cdn/shopifycloud/checkout-web/assets/c1/graphql-redeemable.D5CsnAXy.js","/cdn/shopifycloud/checkout-web/assets/c1/hydrate.CRG1hGKC.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayExternalAppContext.C5SMSoXz.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-en.BFA7q2nR.js","/cdn/shopifycloud/checkout-web/assets/c1/OnePage.D3E4OJwG.js","/cdn/shopifycloud/checkout-web/assets/c1/components-DeliveryTransition.Dpz02vHG.js","/cdn/shopifycloud/checkout-web/assets/c1/useShopPayButtonClassName.BQKsqdrW.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSuppressShopPayModalOnLoad.DMdE-Got.js","/cdn/shopifycloud/checkout-web/assets/c1/crypto-constants.X7Rewxwj.js","/cdn/shopifycloud/checkout-web/assets/c1/ChangeCompanyLocationLink.CJlD7QLY.js","/cdn/shopifycloud/checkout-web/assets/c1/BillingAddressForm.Dhswp8OC.js","/cdn/shopifycloud/checkout-web/assets/c1/PhoneField.x8-2YVGv.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodRateLabel.C1gOJRW-.js","/cdn/shopifycloud/checkout-web/assets/c1/components-RedirectionNotice.module.9h4Cs9cI.js","/cdn/shopifycloud/checkout-web/assets/c1/Choice.Z-ZMdsGl.js","/cdn/shopifycloud/checkout-web/assets/c1/Checkbox.BetH-wm9.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useCanChangeCompanyLocation.4YiomcEL.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUnauthenticatedErrorModal.Djwgi4Hk.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl.11ZgJCJk.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-previous.ZSrVqQ5s.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo.CXftHfE9.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useWalletsTimeout.LS7cUNS-.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePostPurchase.D-wf3MUM.js","/cdn/shopifycloud/checkout-web/assets/c1/Monorail-monorailMetric-wallets.ByAtkyP_.js","/cdn/shopifycloud/checkout-web/assets/c1/shop-pay-installments-monorail.BViXwIOh.js","/cdn/shopifycloud/checkout-web/assets/c1/IncentiveBadge.2ZEUDDvP.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks.cC10-xZ6.js","/cdn/shopifycloud/checkout-web/assets/c1/PendingShipping.DEbIaqr-.js","/cdn/shopifycloud/checkout-web/assets/c1/useAddressMutationsWithNegotiation.CMArH9pq.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentIcon.B_0qKWn9.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentLine.BUREorSI.js","/cdn/shopifycloud/checkout-web/assets/c1/Theme-ThemeOverride.Bk8I8Azt.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useUpdateCheckoutAddress.BML4-q-6.js","/cdn/shopifycloud/checkout-web/assets/c1/payment-usePaymentExemptionReason.BEA8CWFE.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayProgressIntercepts.DIOax5w9.js","/cdn/shopifycloud/checkout-web/assets/c1/Section.CSStE2_j.js","/cdn/shopifycloud/checkout-web/assets/c1/Section-SectionStyleOverride.DX_L8-17.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentErrorBanner.Bb19odP2.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useGeneralPaymentErrorMessage.Bp56WnUo.js","/cdn/shopifycloud/checkout-web/assets/c1/StickyPayButton-StickyPayButton.module.DNZ2rTAd.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-payment-button.C0M3YazT.js","/cdn/shopifycloud/checkout-web/assets/c1/CaptureEvents-ButtonWithRegisterWebPixel.nPkbMMn5.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShouldRevealExtension.C1Nmd8DD.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-usePreselectSpi.BlfJeyKx.js","/cdn/shopifycloud/checkout-web/assets/c1/Switch.CSQ9Nzja.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useAvailableShopPromotionDiscounts.DOSDfwvP.js","/cdn/shopifycloud/checkout-web/assets/c1/checkout-as-guest-amazon-pay.BR4Hg-Xt.js","/cdn/shopifycloud/checkout-web/assets/c1/Middot.DCmaSZol.js","/cdn/shopifycloud/checkout-web/assets/c1/EstimatedDeliveryContent.D5KbdSM9.js","/cdn/shopifycloud/checkout-web/assets/c1/shipping-methods-consolidated-included.DVhV61ZZ.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingLines._sG6Qkh7.js","/cdn/shopifycloud/checkout-web/assets/c1/ShipmentBreakdown.CUX-DTI8.js","/cdn/shopifycloud/checkout-web/assets/c1/MerchandiseModal.CJIb3zJs.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingMethodSelector.CCBosKSZ.js","/cdn/shopifycloud/checkout-web/assets/c1/TextArea.FVx2cdtx.js","/cdn/shopifycloud/checkout-web/assets/c1/SubscriptionPriceBreakdown.B3QC0vN4.js","/cdn/shopifycloud/checkout-web/assets/c1/StockProblems-StockProblemsLineItemList.BBo8zgen.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.C61fwjfC.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/checkout-policy.Dy6nOzcc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/helpers.BVCZzykB.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.Wbasq9un.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DeliveryTransition.CxmS455s.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useAddressMutationsWithNegotiation.DPEapfiO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Section.CU18S7Ap.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentLine.D3bcP-mr.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StickyPayButton.3WRao8Y9.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentIcon.gzvCNwz_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayProgressIntercepts.CIy8uDiZ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Choice.DNWz77j7.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/IncentiveBadge.Dlnp55te.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BillingAddressForm.BdwN7V1K.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Switch.Dq_6Ius6.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.CpHF4L7Q.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PhoneField.uZEuHncj.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Middot.D7Ujmshx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingLines.LcqrKXE1.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MerchandiseModal.D6OuIVjc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/EstimatedDeliveryContent.B_THySFF.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RedirectionNotice.B8v_QGNW.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  