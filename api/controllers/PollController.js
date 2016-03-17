/**
 * PollController
 *
 * @description :: Server-side logic for managing polls
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	_config: {
		actions: false,
		shortcuts: false,
		rest: false
	},

	poll: function(req, res) {
		var name = req.param('name');
		return res.view('partials/' + name);
	},

	pollItem: function(req, res) {
		var name = req.param('url');
		return res.view('partials/pollitem');
	},

	redirectAll: function(req, res) {
		return res.redirect('/');
	},

	createPoll: function(req, res) {
		var pollData = req.allParams();

		Poll.create(pollData, function(err, poll) {
			if (err) sails.log(err);
			sails.log(poll);
			return res.ok();
		});
	},

	pollAll: function(req, res) {
		Poll.find().exec(function(err, results) {
			if (err) sails.log(err);
			return res.json(results);
		});
	},

	pollOne: function(req, res) {
		var url = req.params.url;
		Poll.findOne({
			url: url
		}).exec(function(err, poll) {
			if (err) return res.negotiate(err);

			if (!poll) return res.notFound();

			return res.send(poll);
		});
	},

	updatePoll: function(req, res) {
		var url = req.params.url;
		var selectedOption = req.allParams().selectedOption;
		var voter = req.allParams().voter;

		Poll.findOne({
			url: url
		}).exec(function(err, poll) {
			if (err) return res.serverError(err);

			if (!poll) {
				return res.notFound('Not found this poll!');
			}

			// Check if the current account exists in Voters array or not
			if (poll.voters === undefined || poll.voters.length == 0 || poll.voters.indexOf(voter) === -1) {
				var votes = poll.votes;
				var options = poll.options;
				var voters = poll.voters;
				var votePosition = 0;
				var existedOption = false;

				// Find the position of value in array based on options array
				for (var i = 0; i < options.length; i++) {
					if (options[i] === selectedOption) {
						votePosition = i;
						existedOption = true;
					}
				}
				// For existed options
				if (existedOption) {
					votes[votePosition]++;
				}
				// For custom option
				else {
					options.push(selectedOption);
					votes.push(1);
				}

				// Take voter to array
				voters.push(voter);

				Poll.update({
					url: url
				}, {
					options: options,
					votes: votes,
					voters: voters
				}).exec(function(err, result) {
					if (err) return res.negotiate(err);
					return res.send(result);
				});
			} else {
				return res.send({message: 'Error: You can only vote once a poll! (user or ip voted)'});
			}
		});
	},

	deletePoll: function(req, res) {
		var url = req.params.url;

		Poll.destroy({
			url: url
		}).exec(function(err) {
			if (err)
				return res.negotiate(err);
			sails.log('Deleted 1 record');
			return res.ok();
		})
	},
};
