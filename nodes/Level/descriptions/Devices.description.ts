// -------- Devices --------
else if (resource === 'device') {
	if (operation === 'list') {
		const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
		const limit = this.getNodeParameter('limit', itemIndex, 20) as number;

		// Use the n8n “Additional Fields” collection
		const af = this.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;

		const qs: IDataObject = {};
		// simple copies
		for (const k of [
			'search','group_id','ancestor_group_id','status','os','platform',
			'page','per_page','last_seen_after','starting_after','ending_before',
		]) {
			if (af[k] !== undefined && af[k] !== '') qs[k] = af[k] as IDataObject;
		}

		// honor Limit when Return All = false
		if (!returnAll) qs.limit = limit;

		// support extraQuery bag
		const pairs = (af?.extraQuery as IDataObject)?.parameter as IDataObject[] | undefined;
		if (Array.isArray(pairs)) {
			for (const p of pairs) {
				const key = (p?.key as string) ?? '';
				if (key) qs[key] = p?.value as string;
			}
		}

		if (returnAll) {
			response = await fetchAllCursor('/devices', qs, 100);
		} else {
			response = await levelApiRequest.call(this, 'GET', '/devices', {}, qs);
		}
	}
	else if (operation === 'get') {
		const id = this.getNodeParameter('id', itemIndex) as string;
		const opts = this.getNodeParameter('deviceGetOptions', itemIndex, {}) as IDataObject;

		const qs: IDataObject = {};
		if (opts.includeOperatingSystem)   qs.include_operating_system  = true;
		if (opts.includeCpus)              qs.include_cpus              = true;
		if (opts.includeMemory)            qs.include_memory            = true;
		if (opts.includeDisks)             qs.include_disks             = true;
		if (opts.includeNetworkInterfaces) qs.include_network_interfaces= true;

		const pairs = (opts?.extraQuery as IDataObject)?.parameter as IDataObject[] | undefined;
		if (Array.isArray(pairs)) {
			for (const p of pairs) {
				const key = (p?.key as string) ?? '';
				if (key) qs[key] = p?.value as string;
			}
		}

		response = await levelApiRequest.call(this, 'GET', `/devices/${id}`, {}, qs);
	}
	else {
		throw new Error(`Unsupported devices operation: ${operation}`);
	}
}
