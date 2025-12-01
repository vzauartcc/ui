<template>
	<div class="card">
		<div class="card-content">
			<p class="card-title">Privacy Policy</p>
			<p>Last updated: <b>01 DEC 2025</b></p>
			<p class="card-title">Information We Collect</p>
			<p>
				As a guest, the Chicago ARTCC collects limited information about your browsing experience,
				including:
			</p>
			<ul class="browser-default">
				<li>
					non-identifiable information about your browser, operating system, IP Address, the
					geolocation associated with the IP address,
				</li>
				<li>activities performed with the Chicago ARTCC web services, and</li>
				<li>
					when you encounter an error on our website, information about the error encountered.
				</li>
			</ul>
			<p>
				When you log into our site with your VATSIM account, or request a transfer to our facility
				or have your visit application accepted, we collect the following personally identifiable
				information provided to us from VATSIM and VATUSA in addition to the information above:
			</p>
			<ul class="browser-default">
				<li>your name,</li>
				<li>VATSIM associated email address,</li>
				<li>VATSIM Certificate ID,</li>
				<li>VATSIM controller rating,</li>
				<li>your home facility, and</li>
				<li>your email broadcast opt-in status (from VATUSA).</li>
			</ul>
			<p class="card-title">Information You Share</p>
			<p>
				When using our site while logged in, we collect information you share with us, including:
			</p>
			<ul class="browser-default">
				<li>
					when you submit feedback on our website, we collect the data you choose to submit through
					the form. Your name, email address, and VATSIM Certificate ID are always collected and
					shared with the ATM, DATM, and TA,
				</li>
				<li>when you submit a visit application, we collect the data you provide in the form,</li>
				<li>when you sign up for an event, we collect the data you provided in the form,</li>
				<li>
					when you choose to link your Discord account with your account on our site, we collect
					your Discord user ID, for the sole purpose of linking the two accounts together,
				</li>
				<li>
					as a member of the training or staff teams, we collect the data you provide by submitting
					events, documents, downloads, training session notes, etc.
				</li>
			</ul>
			<p class="card-title">Sharing Your Information</p>
			<p>We may share your information, in limited capacities, with:</p>
			<ul class="browser-default">
				<li>VATSIM Inc. (<a href="https://vatsim.net/">vatsim.net</a>),</li>
				<li>VATUSA Inc. (<a href="https://vatusa.net/">vatusa.net</a>),</li>
				<li>other subdivisions/facilities affiliated with VATSIM and VATUSA, and</li>
				<li>law enforcement agencies by request.</li>
			</ul>
			<p>
				Some of the information we collect (such as your name, VATSIM controller rating, VATSIM
				Certificate ID) will be shared, in limited capacities, with other users who log onto our
				site.
			</p>
			<p>
				We do not sell, or rent your data to any third-parties outside of VATSIM. We do not or share
				your data for marketing purposes.
			</p>
			<p class="card-title">Cookies</p>
			<p>
				Cookies are information stored by the user's browser and accessed by the Chicago ARTCC
				website for the purposes of enhancing the user experience. This allows us to know who is
				requesting and using our services, provide authentication and authorization checks to
				restricted areas. Chicago ARTCC only stores cookies in your browser when you log in, and
				will be deleted when you log out, or after 30 days. Users may choose, at their own
				discretion, to disable cookie access from within their browser; however, the functionality
				of the Chicago ARTCC website will be severely limited.
			</p>
			<p class="card-title">Opt Out</p>
			<p>
				Given the nature of our services, it is not possible to opt out of data collection and use
				our services. But if you desire to opt out and no longer use our services, we will purge all
				information we have collected upon written request. The first step is to deactivate your
				VATSIM account and request VATSIM to purge your data. Please head to
				<a href="https://membership.vatsim.net/" noopener noreferrer target="_blank"
					>https://membership.vatsim.net/</a
				>
				to do so. After VATSIM has purged your data, please send an
				<a href="mailto:atm@zauartcc.org?subject=Right to Erasure Request">email to our ATM</a>.
				Please allow 30 days for your request to be processed. You will receive an email response
				when your request has been successfully processed.
				<b
					>Chicago ARTCC cannot guarantee that information shared with or collected by other parties
					will be erased as part of this process.</b
				>
			</p>
		</div>
	</div>
</template>

<script>
export default {
	name: 'PrivacyPolicy',
	title: 'Privacy Policy',
};
</script>

<style lang="scss" scoped>
.card-content {
	p + p {
		margin-top: 1.5em;
	}
}
img {
	max-width: 100%;
}
</style>
