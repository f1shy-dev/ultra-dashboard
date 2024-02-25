(() => {
	self.__rapidengine$config = {
		prefix: "/rdll_kit/anti_tamper",
		bare: "/bare/",
		encodeUrl: RDLLCore.codec.xor.encode,
		decodeUrl: RDLLCore.codec.xor.decode,
		handler: "/rdll_kit/rdll_grab_handlepak.js",
		client: "/rdll_kit/rdll_client_abs4.js",
		bundle: "/rdll_kit/rdll_client_bpack.js",
		config: "/rdll_kit/global_rdll_config.js",
		sw: "/rdll_kit/rdll_sinvoke_engine.js",
	};
})();
