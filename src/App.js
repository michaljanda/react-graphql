import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

const axiosGitHubGraphQl = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {Authorization: 'bearer 548ec9c1f65bf856c3591dda16db844474423895'}
});

const getIssuesOfRepositoryQuery = () => `
  query ($organization: String!, $repository: String!, $cursor: String) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        viewerHasStarred
        issues(first: 3, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
  
`;

const getIssuesOfRepository = (path, cursor) => {
  const [organization, repository] = path.split('/');

  return axiosGitHubGraphQl.post('', {
    query: getIssuesOfRepositoryQuery(organization, repository),
    variables: {organization, repository, cursor}
  });
};

const resolveIssuesQuery = (queryResult, cursor) => state => {
  const { data, errors } = queryResult.data;

  if (!cursor) {
    return {
      organization: data.organization,
      errors,
    };
  }

  const { edges: oldIssues } = state.organization.repository.issues;
  const { edges: newIssues } = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        },
      },
    },
    errors,
  };
};

class App extends Component {

  state = {
    path: 'the-road-to-learn-react/the-road-to-learn-react',
    organization: null,
    errors: null
  }

  componentDidMount() {
    this.onFetchFromGitHub(this.state.path);
  }

  onChange = event => {
    this.setState({path: event.target.value});
  }

  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
    event.preventDefault();
  }

  onFetchFromGitHub = (path, cursor) => {
    getIssuesOfRepository(path, cursor).then(result => this.setState(resolveIssuesQuery(result, cursor)));
  }

  onFetchMoreIssues = () => {
    const {endCursor} = this.state.organization.repository.issues.pageInfo;
    this.onFetchFromGitHub(this.state.path, endCursor)
  }

  render() {
    const {path, organization, errors} = this.state;

    return (
      <div className="App">
        <img src={logo} className="App-logo" alt="logo"/>
        <h1>React GraphQL</h1>
        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com
          </label>
          <input
            type="text"
            id="url"
            onChange={this.onChange}
            style={{width: '300px'}}
            value={path}
          />

          <button type="submit">Search</button>

          <hr/>
          {organization && (
            <Organization organization={organization} onFetchMoreIssues={() => this.onFetchMoreIssues()}/>
          )}
          {errors && (
            JSON.stringify(errors)
          )}
        </form>
      </div>
    );
  }
}

const Repository = ({repository, onFetchMoreIssues}) => {
  return (
    <div>
      <p>
        <strong>In Repository:</strong>
        <a href={repository.url}>{repository.name}</a>
      </p>
      <ul>
        {repository.issues.edges.map(issue => (
          <li key={issue.node.id}>
            <a href={issue.node.url}>{issue.node.title}</a>
            <ul>
              {issue.node.reactions.edges.map(reaction => (
                <li key={reaction.node.id}>{reaction.node.content}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <hr/>
      {repository.issues.pageInfo.hasNextPage && (
        <button type="button" onClick={onFetchMoreIssues}>More</button>
      )}
    </div>
  )
}

const Organization = ({organization, errors, onFetchMoreIssues}) => {
  if (! errors) {
    return (
      <div>
        <p>
          <strong>Issues from Organization:</strong>
          <a href={organization.url}>{organization.name}</a>
        </p>
        <Repository repository={organization.repository} onFetchMoreIssues={onFetchMoreIssues}/>
      </div>
    )
  }
};


export default App;
