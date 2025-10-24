<template>
	<span class="small-spinner" roles="status" aria-hidden="true"></span>
</template>

<style scoped>
.small-spinner {
	display: inline-block;
	width: 1em;
	height: 1em;
	margin-bottom: 0.15rem;
	vertical-align: text-bottom;
	margin-right: 0.25rem;
	border: 0.2em solid currentColor;
	border-right-color: transparent;
	border-radius: 50%;
	animation: small-spinner-animation 1s linear infinite;
}

@keyframes small-spinner-animation {
	to {
		transform: rotate(360deg);
	}
}
</style>
