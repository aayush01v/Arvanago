XHRPOST
https://edusimulate.in/api/create-order
[HTTP/2 500  2404ms]

	
POST
	https://edusimulate.in/api/create-order
Status
500
VersionHTTP/2
Transferred2.42 kB (240 B size)
Referrer Policystrict-origin-when-cross-origin
DNS ResolutionSystem

	
cache-control
	public, max-age=0, must-revalidate
content-length
	240
content-security-policy
	default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://checkout-static-next.razorpay.com https://pagead2.googlesyndication.com https://www.google.com https://www.googletagmanager.com https://partner.googleadservices.com https://*.adtrafficquality.google https://*.gstatic.com https://apis.google.com https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img…ront.net https://www.youtube.com; frame-src 'self' https://edusimulate.in https://*.firebaseapp.com https://player.vimeo.com https://checkout.razorpay.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://api.razorpay.com https://apis.google.com https://www.youtube.com https://www.google.com https://*.adtrafficquality.google; frame-ancestors 'self' https://edusimulate.in https://www.edusimulate.in; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;
content-type
	application/json; charset=utf-8
cross-origin-opener-policy
	same-origin-allow-popups
date
	Sat, 04 Apr 2026 19:01:02 GMT
etag
	W/"f0-2k+qoarJAI1P8JGAqBE6emLd2Ns"
permissions-policy
	geolocation=(), microphone=(self), camera=(self), display-capture=(self)
referrer-policy
	strict-origin-when-cross-origin
server
	Vercel
strict-transport-security
	max-age=63072000
x-content-type-options
	nosniff
X-Firefox-Spdy
	h2
x-vercel-cache
	MISS
x-vercel-id
	bom1::iad1::vp8lq-1775329259824-e4b1794e41ad
	
Accept
	*/*
Accept-Encoding
	gzip, deflate, br, zstd
Accept-Language
	en-US,en;q=0.5
Connection
	keep-alive
Content-Length
	42
Content-Type
	application/json
Cookie
	rzp_unified_session_id=SZW2xce5E86j10
Host
	edusimulate.in
Origin
	https://edusimulate.in
Priority
	u=4
Referer
	https://edusimulate.in/explore
Sec-Fetch-Dest
	empty
Sec-Fetch-Mode
	cors
Sec-Fetch-Site
	same-origin
TE
	trailers
User-Agent
	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0
Cookie “onComplete” will soon be rejected because it is foreign and does not have the “Partitioned“ attribute. public
Partitioned cookie or storage access was provided to “https://api.razorpay.com/v1/checkout/public?traffic_env=production&build=b3fd5e2fb9ae23367e758c1f098f07fe742d5acc&build_v1=95116d6cc420916ce3670edbea4b0e136ba1271c&checkout_v2=1&new_session=1&rzp_device_id=1.b8095d7d178f8ffab52ae6cc149b7da29437037a.1775324478984.43821685&unified_session_id=SZW2xce5E86j10&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B” because it is loaded in the third-party context and dynamic state partitioning is enabled.
v2-entry.modern.js:1:31009
GET
https://checkout-static-next.razorpay.com/build/undefined
NS_BINDING_ABORTED

A resource is blocked by OpaqueResponseBlocking, please check browser console for details. undefined
Backend API missing or failing. Using Mock Order Data for testing. useRazorpayEnrollment-5jvMetUf.js:1:1449
XHRPOST
https://api.razorpay.com/v2/standard_checkout/preferences?key_id=rzp_live_SZ6vI4XmUlMddD&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B
[HTTP/1.1 400 Bad Request 31ms]

	
POST
	https://api.razorpay.com/v2/standard_checkout/preferences?key_id=rzp_live_SZ6vI4XmUlMddD&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B
Status
400
Bad Request
VersionHTTP/1.1
Transferred930 B (125 B size)
Referrer Policystrict-origin-when-cross-origin
DNS ResolutionSystem

	
Access-Control-Allow-Headers
	Accept, Accept-Encoding, Accept-Language, Authorization, Content-Type, Content-Length, Cookie, ResponseType
Access-Control-Allow-Methods
	GET, HEAD, OPTIONS, PATCH, POST
Access-Control-Allow-Origin
	https://api.razorpay.com
Access-Control-Max-Age
	86400
Cache-Control
	nocache, no-store, max-age=0, must-revalidate
Connection
	keep-alive
Content-Length
	125
Content-Type
	application/json
Date
	Sat, 04 Apr 2026 19:01:02 GMT
Expires
	Fri, 01 Jan 1990 00:00:00 GMT
Mode
	live
Pragma
	no-cache
Request-Id
	d78lvrgihlms75dov6t0
Strict-Transport-Security
	max-age=315360000; includeSubDomains
Vary
	Accept-Encoding
X-Checkout-Service-Proxy
	checkout-service
X-Client-Ip
	4.240.18.229
X-Frame-Options
	SAMEORIGIN
X-Xss-Protection
	0
	
Accept
	*/*
Accept-Encoding
	gzip, deflate, br, zstd
Accept-Language
	en-US,en;q=0.5
Connection
	keep-alive
Content-Length
	836
Content-type
	application/json
Host
	api.razorpay.com
Origin
	https://api.razorpay.com
Referer
	https://api.razorpay.com/v1/checkout/public?traffic_env=production&build=b3fd5e2fb9ae23367e758c1f098f07fe742d5acc&build_v1=95116d6cc420916ce3670edbea4b0e136ba1271c&checkout_v2=1&new_session=1&rzp_device_id=1.b8095d7d178f8ffab52ae6cc149b7da29437037a.1775324478984.43821685&unified_session_id=SZW2xce5E86j10&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B
Sec-Fetch-Dest
	empty
Sec-Fetch-Mode
	cors
Sec-Fetch-Site
	same-origin
User-Agent
	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0

    x-session-token
    	0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B

XHRGET
https://api.razorpay.com/v1/standard_checkout/preferences?key_id=rzp_live_SZ6vI4XmUlMddD&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B&currency[0]=INR&qr_required=true&option_currency=INR&order_id=order_mock_1775329262277&amount=259900&personalisation=1&_[preference_source]=public_page&_[build]=23847013123&_[library]=checkoutjs&_[platform]=browser&_[checkout_id]=SZWWSOO4e0oKPm&_[request_index]=0
[HTTP/1.1 400 Bad Request 27ms]

	
GET
	https://api.razorpay.com/v1/standard_checkout/preferences?key_id=rzp_live_SZ6vI4XmUlMddD&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B&currency[0]=INR&qr_required=true&option_currency=INR&order_id=order_mock_1775329262277&amount=259900&personalisation=1&_[preference_source]=public_page&_[build]=23847013123&_[library]=checkoutjs&_[platform]=browser&_[checkout_id]=SZWWSOO4e0oKPm&_[request_index]=0
Status
400
Bad Request
VersionHTTP/1.1
Transferred701 B (184 B size)
Referrer Policystrict-origin-when-cross-origin
DNS ResolutionSystem

	
Cache-Control
	nocache, no-store, max-age=0, must-revalidate
Connection
	keep-alive
Content-Length
	184
Content-Type
	application/json
Date
	Sat, 04 Apr 2026 19:01:02 GMT
Expires
	Fri, 01 Jan 1990 00:00:00 GMT
Mode
	live
Pragma
	no-cache
Request-Id
	d78lvrj7mi7s7598ji6g
Strict-Transport-Security
	max-age=315360000; includeSubDomains
Vary
	Accept-Encoding
X-Checkout-Service-Proxy
	checkout-service
X-Client-Ip
	4.240.18.229
X-Frame-Options
	SAMEORIGIN
X-Xss-Protection
	0
	
Accept
	*/*
Accept-Encoding
	gzip, deflate, br, zstd
Accept-Language
	en-US,en;q=0.5
Connection
	keep-alive
Content-type
	application/x-www-form-urlencoded
Host
	api.razorpay.com
Referer
	https://api.razorpay.com/v1/checkout/public?traffic_env=production&build=b3fd5e2fb9ae23367e758c1f098f07fe742d5acc&build_v1=95116d6cc420916ce3670edbea4b0e136ba1271c&checkout_v2=1&new_session=1&rzp_device_id=1.b8095d7d178f8ffab52ae6cc149b7da29437037a.1775324478984.43821685&unified_session_id=SZW2xce5E86j10&session_token=0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B
Sec-Fetch-Dest
	empty
Sec-Fetch-Mode
	cors
Sec-Fetch-Site
	same-origin
User-Agent
	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0

    x-session-token
    	0E8A0D7E108046B42502A3337F3B599F22E38117C998BBB1ECDFB8347EAF4280839BBC8904E1FCD83D55B87D8BA83ACC335C1ED8D929915A7CC4DC47833B82AF82258794CD32AB795D1673A0CFD367C8519E7008D3AA221784AE34A8FC5AA00EDDAFD370C5F59E1B

The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-v2-icon-common-73db1018.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-analytics-635a28a7.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-v2-icon-common0-17d40644.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-v2-standard-icon-common-339ee233.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-illustration-15403552.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-customer-678aa8ce.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-shield-90dd02df.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-merchant-identity-96e6e142.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-home-a841bae9.modern.js” preloaded with link preload was not used within a few seconds. Make sure all attributes of the preload tag are set correctly. public
The resource at “https://checkout-static-next.razorpay.com/build/chunks/v2-entry-upi-a20dd702.