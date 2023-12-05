import React from "react"
import { Common, Renderer } from "@k8slens/extensions"

const {
  Component: { MenuItem, Icon, SubMenu, StatusBrick },
  Navigation,
} = Renderer

type Pod = Renderer.K8sApi.Pod

export class PodLogs {

  /**
   * Get the container name list by a list of pods.
   *
   * @param podList
   * @returns a set, without duplicates
   */
  public static getContainersByPodList(pod: Pod): Set<string> {
    const containerNameList: Set<string> = new Set()
    const containers = pod.getContainers()
    for (let j = 0; j < containers.length; j++) {
      containerNameList.add(containers[j].name)
    }

    return containerNameList
  }

  /**
   * Construct the menu voices.
   *
   * @param props
   * @param containerNames
   * @param resourceNs
   * @param resourceName
   * @param resourceTitle
   * @returns the MenuItem to show in Lens
   */
  public static uiMenu(
    props: any,
    containerNames: Set<string>,
    resourceNs: string,
    resourceName: string,
    resourceTitle: string
  ) {
    return (
      <MenuItem
        onClick={Common.Util.prevDefault(() =>
          this.podLogs(resourceNs, resourceName, resourceTitle, Array.from(containerNames)?.slice(-1)[0])
        )}
      >
        <Icon
          material="subject"
          interactive={props.toolbar}
          tooltip="Logs w/fblog"
        />
        <span className="title">Logs w/fblog</span>
        {
          containerNames.size >= 1 && (
            <>
              <Icon material="keyboard_arrow_right" />
              <SubMenu>
                {Array.from(containerNames).map((containerName) => {
                  return (
                    <MenuItem
                      key={`only_${containerName}`}
                      onClick={Common.Util.prevDefault(() =>
                        this.podLogs(
                          resourceNs,
                          resourceName,
                          resourceTitle,
                          containerName
                        )
                      )}
                    >
                      <StatusBrick />
                      <span>{containerName}</span>
                    </MenuItem>
                  )
                })}
              </SubMenu>
            </>
          )
        }
      </MenuItem>
    )
  }

  private static podLogs(
    resourceNs: string,
    resourceName: string,
    resourceTitle: string,
    containerName?: string
  ) {
    // Generate log command with fblog
    const cmd = `kubectl logs -f -n ${resourceNs} ${resourceName} -c ${containerName} --tail=500 | fblog -p --main-line-format "{{bold(fixed_size 19 fblog_timestamp)}} {{level_style (uppercase (fixed_size 5 fblog_level))}} [{{fixed_size 15 thread}}] [{{#if reqId}}{{yellow reqId}}{{/if}}] {{#if thread}}{{cyan(fixed_size 42 thread)}}{{/if}} : {{#if fblog_prefix}}{{bold(cyan fblog_prefix)}}{{/if}} {{fblog_message}}"`

    // Open new terminal
    this.openTerminal(
      `${resourceTitle}: ${resourceName}:${containerName} | fblog`,
      cmd
    )
  }

  private static openTerminal(title: string, command: string) {
    const tab = Renderer.Component.createTerminalTab({
      title: title,
    })

    Renderer.Component.terminalStore.sendCommand(command, {
      enter: true,
      tabId: tab.id,
    })

    Renderer.Navigation.hideDetails()
  }
}
