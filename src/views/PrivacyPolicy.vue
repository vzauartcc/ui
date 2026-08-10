<script setup lang="ts">
import { useTitle } from '@/utils/title';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import Card from 'primevue/card';

useTitle('Privacy Policy');
</script>

<template>
  <Card>
    <template #title>Privacy Policy</template>
    <template #subtitle
      >Last Updated: <span class="font-bold">01 DEC 2025</span></template
    >
    <template #content>
      <Accordion multiple>
        <AccordionPanel value="0">
          <AccordionHeader>Information We Collect</AccordionHeader>
          <AccordionContent>
            <p>
              As a guest, the Virtual Chicago ARTCC collects limited information
              about your browsing experience, including:
            </p>
            <ul class="list-disc ml-7 -mt-3 space-y-1">
              <li>
                non-identifiable information about your browser, operating
                system, and IP Address,
              </li>
              <li>
                activities performed with the Virtual Chicago ARTCC web
                services, and
              </li>
              <li>
                when you encounter an error on our website, information about
                the error encountered.
              </li>
            </ul>
            <br />
            <p>
              When you log into our site with your VATSIM account, or request a
              transfer to our facility, or have your visit application accepted,
              we collect the following personally identifiable information
              provided to us from VATSIM and VATUSA in addition to the
              information above:
            </p>

            <ul class="list-disc ml-7 -mt-3 space-y-1">
              <li>your name (as recorded with VATSIM),</li>
              <li>VATSIM associated email address,</li>
              <li>VATSIM Certificate ID,</li>
              <li>VATSIM controller rating,</li>
              <li>your home facility, and</li>
              <li>your email broadcast opt-in status (from VATUSA).</li>
            </ul>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="1">
          <AccordionHeader>Information You Share</AccordionHeader>
          <AccordionContent>
            <p>
              When using our site while logged in, we collect information you
              share with us, including:
            </p>
            <ul class="list-disc ml-7 -mt-3 space-y-1">
              <li>
                when you submit feedback on our website, we collect the data you
                choose to submit through the form. Your name, email address, and
                VATSIM Certificate ID are always collected and shared with the
                ATM, DATM, and TA,
              </li>
              <li>
                when you submit a visit application, we collect the data you
                provide in the form,
              </li>
              <li>
                when you sign up for an event, we collect the data you provided
                in the form,
              </li>
              <li>
                when you choose to link your Discord account with your account
                on our site, we collect your Discord user ID, for the sole
                purpose of linking the two accounts together,
              </li>
              <li>
                as a member of the training or staff teams, we collect the data
                you provide by submitting events, documents, downloads, training
                session notes, etc.
              </li>
            </ul>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="2">
          <AccordionHeader>Sharing Your Information</AccordionHeader>
          <AccordionContent>
            <p>We may share your information, in limited capacities, with:</p>
            <ul class="list-disc ml-7 -mt-3 space-y-1">
              <li>
                VATSIM Inc. (<a href="https://vatsim.net/">vatsim.net</a>),
              </li>
              <li>
                VATUSA Inc. (<a href="https://vatusa.net/">vatusa.net</a>),
              </li>
              <li>
                other subdivisions/facilities affiliated with VATSIM and VATUSA,
                and
              </li>
              <li>law enforcement agencies by request.</li>
            </ul>
            <p>
              Some of the information we collect (such as your name, VATSIM
              controller rating, VATSIM Certificate ID) will be shared, in
              limited capacities, with other users who log onto our site.
            </p>
            <p>
              We do not sell, or rent your data to any third-parties outside of
              VATSIM. We do not or share your data for marketing purposes.
            </p>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="3">
          <AccordionHeader>Cookies</AccordionHeader>
          <AccordionContent>
            <p>
              Cookies are information stored by the user's browser and accessed
              by the Virtual Chicago ARTCC website for the purposes of enhancing
              the user experience. This allows us to know who is requesting and
              using our services, provide authentication and authorization
              checks to restricted areas. Virtual Chicago ARTCC only stores
              cookies in your browser when you log in, and will be deleted when
              you log out, or after 30 days. Users may choose, at their own
              discretion, to disable cookie access from within their browser;
              however, the functionality of the Virtual Chicago ARTCC website
              will be severely limited.
            </p>
          </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="4">
          <AccordionHeader>Opt Out</AccordionHeader>
          <AccordionContent>
            <p>
              Given the nature of our services, it is not possible to opt out of
              data collection and use our services. But if you desire to opt out
              and no longer use our services, we will purge all information we
              have collected upon written request. The first step is to
              deactivate your VATSIM account and request VATSIM to purge your
              data. Please head to
              <a
                href="https://membership.vatsim.net/"
                target="_blank"
                rel="noopener noreferrer"
                class="underline"
                >https://membership.vatsim.net/</a
              >
              to do so. After VATSIM has purged your data, please send an
              <a
                class="underline"
                href="mailto:atm@zauartcc.org?subject=Right to Erasure Request"
                >email to our ATM</a
              >. Please allow 30 days for your request to be processed. You will
              receive an email response when your request has been successfully
              processed.
              <b
                >Virtual Chicago ARTCC cannot guarantee that information shared
                with or collected by other parties will be erased as part of
                this process.</b
              >
            </p>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
