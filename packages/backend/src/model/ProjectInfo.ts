import { EthereumAddress, ProjectId } from '@l2beat/common'
import { getTokenBySymbol, Project, TokenInfo, tokenList } from '@l2beat/config'

export interface ProjectInfo {
  name: string
  projectId: ProjectId
  bridges: BridgeInfo[]
}

export interface BridgeInfo {
  address: EthereumAddress
  sinceBlock: number
  tokens: TokenInfo[]
}

export function projectToInfo(project: Project): ProjectInfo {
  return {
    name: project.name,
    projectId: project.id,
    bridges: project.bridges.map((bridge) => ({
      address: EthereumAddress(bridge.address),
      sinceBlock: bridge.sinceBlock,
      tokens:
        bridge.tokens === '*' ? tokenList : bridge.tokens.map(getTokenBySymbol),
    })),
  }
}
