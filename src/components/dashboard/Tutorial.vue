<template>
  <div v-if="tutorial"
       class="tutorial"
       @keydown.left="currentStep--"
       @keydown.right="currentStep++"
  >
    <div class="content" aria-live="polite">
      <div v-for="(step) in steps"
           :key="step.number"
           :id="`TutorialStep${step.number}`"
           :class="{
               currentStep: step.number === currentStep,
               done: step.number < currentStep,
               step: true
           }"

           :aria-hidden="step.number === currentStep ? 'false' : 'true'"
      >
        <!-- For svg images, use an object so the document is added to the dom for animation control. -->
        <object v-if="step.image.toLowerCase().endsWith('.svg')"
                type="image/svg+xml"
                :data="step.image"
                class="stepImage"
                aria-describedby="StepText"
                role="img"
        />
        <b-img v-else
               :src="step.image"
               class="stepImage"
               aria-describedby="StepText"
               alt=""
        />

        <div id="StepText" class="text" v-html="step.text" />
      </div>

      <div class="pager" tabindex="0"
           autofocus
           :class="{complete: currentStep >= tutorial.steps}">

        <b-button variant="success"
                  class="invisible"
                  disabled
                  v-t="'Tutorial.done_button'" />

        <b-button variant="none"
                  class="prev"
                  @click="currentStep--"
                  :disabled="currentStep <= 1"
                  :aria-label="$t('Tutorial.previous_aria-label')"
        >
          <b-icon icon="play-circle-fill" rotate="180" scale="2" />
        </b-button>

        <b-button variant="none" v-for="(step) in steps"
                  :key="step.number"
                  :class="{active: currentStep === step.number}"
                  @click="currentStep = step.number"
                  :aria-label="$t('Tutorial.step_arial-label', {step: step.number} )"
            >
          <b-icon v-if="currentStep === step.number" icon="circle-fill" scale="1.1" />
          <b-icon v-else icon="record-circle-fill" scale="0.8" />
        </b-button>

        <b-button ref="NextButton"
                  variant="none"
                  class="next"
                  @click="next()"
                  :disabled="currentStep >= tutorial.steps"
                  :aria-label="$t('Tutorial.next_aria-label')"
        >
          <b-icon icon="play-circle-fill" scale="2" />
        </b-button>

        <b-button ref="DoneButton"
                  variant="success"
                  class="done"
                  @click="$emit('done')"
                  :disabled="currentStep < tutorial.steps"
                  v-t="'Tutorial.done_button'" />
      </div>

    </div>
  </div>
</template>

<style lang="scss">
@import "~@/styles/_variables.scss";

.tutorial {
  overflow: hidden;

  .content {

    .pager {
      display: flex;
      align-items: center;

      & > :not(.done) {
        color: $link-color-darker;
        padding: 0.1em;
        margin: 0.5em;
      }

      .prev, .next {
        color: $morphic-green-color;
        margin: 0 0.5em;
      }


      .done, &.complete .next {
        visibility: hidden;
        order: 101;
      }

      &.complete .done, &:not(.complete) .next {
        visibility: visible;
        order: 100;
      }

      margin: 1em auto;
      .prev {
        //margin-left: 5em;
      }

    }

    .page-link {
      .active {
        color: $link-color-darker;
      }
    }

    .disabled {
      .prev, .next {
        color: #999;
      }
    }

    display: grid;

    .step {
      // Make the steps stack over each other
      grid-area: 1 / 1 / 2 / 2;

      width: 80%;
      margin: 0 auto;
      background-color: white;
      top: 0;

      // Slide the steps in and out
      transition: all 200ms ease;
      transform: translateX(10em);
      opacity: 0;

      &.done {
        transform: translateX(-10em);
      }

      &.currentStep {
        opacity: 1;
        transform: translateX(0);
      }

      .text {
        padding: 1em 2em;
      }
    }

    #DoneItem {
      display: none;
    }

    li:not(:first-child).disabled {
      //      display: none;
      & + #DoneItem {
        display: unset;
      }
    }
  }
}

</style>

<script>

export default {
    name: "Tutorial",
    data() {
        return {
            tutorials: {
                "getting-started": {
                    steps: 6,
                    imageFile: "tutorialStd{step}.svg"
                }
            },
            currentStepValue: 1
        };
    },
    props: {
        tutorialId: String
    },
    computed: {
        tutorial: function () {
            return this.tutorials[this.tutorialId];
        },
        steps: function () {
            const steps = [];

            for (let i = 0; i < this.tutorial.steps; i++) {
                const imageFile = this.tutorial.imageFile.replace(/\{step}/g, i + 1);

                const messageKey = `Tutorial.${this.tutorialId}.steps.${i}.text`;
                const lines = this.$t(messageKey);
                const text = Array.isArray(lines) ? lines.join("<br/>") : lines;

                steps.push({
                    number: i + 1,
                    image: `/tutorials/${this.tutorialId}/${imageFile}`,
                    text: text
                });
            }

            return steps;
        },
        currentStep: {
            get: function () {
                return this.currentStepValue;
            },
            set: function (newValue) {
                this.currentStepValue = Math.max(1, Math.min(this.tutorial.steps, newValue));
            }
        }
    },
    methods: {
        start: function () {
            this.currentStep = 1;
            this.$refs.NextButton.focus();
        },
        next: function () {
            this.currentStep++;
        }
    },
    watch: {
        currentStep: function (newValue, oldValue) {

            // Reset the animation of an svg image, when it is being displayed
            const svgObject = this.$el.querySelector(`#TutorialStep${newValue} .stepImage`);
            const svgDocument = svgObject?.contentDocument;

            if (svgDocument) {
                const svg = svgDocument.getElementsByTagName("svg")[0];
                svg?.setCurrentTime && svg.setCurrentTime(0);

                if (svgDocument.getAnimations) {
                    svgDocument.getAnimations().forEach(anim => {
                        anim.currentTime = 0;
                    });
                }
            }

            if (newValue >= this.tutorial.steps) {
                this.$nextTick(() => this.$refs.DoneButton.focus());
            } else if (oldValue >= this.tutorial.steps) {
                this.$nextTick(() => this.$refs.NextButton.focus());
            }
        }
    },
    mounted() {

    }
};
</script>
