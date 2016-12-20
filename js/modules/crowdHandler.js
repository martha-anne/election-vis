 function crowdHandler (sb) {

	var crowdUrlRoot = "crowd/crowd-call.php?";

	function INIT () {
		sb.listen({
			listenFor: ["constitSelected"],
			moduleID: this.moduleID,
			moduleFunction: "request",
		})

		sb.listen({
			listenFor: ["receiveConstit"],
			moduleID: this.moduleID,
			moduleFunction: "receive",
		})
	}

	function REQUEST (d) {
		if (d.hasOwnProperty("_about")) {
			var index = d._about.search(/[0-9]{6}/);
			if (index > -1) {
				sb.notify({
					type : "httpGet",
					data: {
						url: sb.dataUrlRoot+"electionresults/"+d._about.substr(index, 6)+".json",
						responseType: "receiveConstit"
					}
				})

			} 
			else {
				debug.sentinel("Can't get constituency ID for "+d.constituency.label._value);
			}
		}
		else {
			debug.sentinel("Selected constituency does not appear to have valid data associated");
		}
	}

	function RECEIVE (d) {
		d=d.data.result.primaryTopic;
		sb.currentConstituency = new index.Constituency(d.constituency.label._value, d.electorate, d.candidate.length);

		//console.log(sb.currentConstituency);
		debug.check("Failed to initialise constituency "+d.constituency.label._value, sb.currentConstituency.init)

		var i;
		var l = sb.currentConstituency.parties_count;
		var crowdsToGet = [];

		for (i=0; i<l; i++) {
			var party = d.candidate[i];
			sb.currentConstituency.add_party(party.party._value, party.fullName._value, party.numberOfVotes);
		}

		l++;
		for (i=0; i<l; i++) {
			notify(crowdUrlRoot+"value="+sb.min+" "+sb.max+" "+
				sb.currentConstituency.parties[i].votes, sb.currentConstituency.parties[i].id);
		}
		/*
		var crowdsToGet = [{id: "nonVoters", size: d.electorate-d.turnout}];

		var i;
		var l = d.candidate.length;

		for (i=0; i<l; i++) {
			crowdsToGet.push({
				id: d.candidate[i].party._value,
				size: d.candidate[i].numberOfVotes
			})
		}

		l=crowdsToGet.length
		for (i=0; i<l; i++) {
			notify(crowdUrlRoot+"value="+sb.min+" "+sb.max+" "+
				crowdsToGet[i].size, crowdsToGet[i].id);
		}*/
	}

	function notify (url, id) {
		sb.notify({
			type : "httpGet",
			data: {
				id: id,
				url: url,
				responseType: "receiveCrowd"
			}
		})
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		crowdUrlRoot = null;
		notify = null;
	}

	return {
        init : INIT,
        request: REQUEST,
        receive: RECEIVE,
        destroy : DESTROY
    };
}