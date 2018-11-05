import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

const axiosGitHubGraphQl = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {Authorization: 'bearer 00425d5265f7ee3557193116019f49762a4f70c5'}
});

const getIssuesOfRepositoryQuery = () => `
  query ($organization: String!, $repository: String!) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(last: 5, states: [OPEN]) {
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
        }
      }
    }
  }
  
`;

const getIssuesOfRepository = path => {
  const [organization, repository] = path.split('/');

  return axiosGitHubGraphQl.post('', {
    query: getIssuesOfRepositoryQuery(organization, repository),
    variables: {organization, repository}
  });
};

const resolveIssuesQuery = queryResult => () => ({
  organization: queryResult.data.data ? queryResult.data.data.organization : null,
  errors: queryResult.data.errors,
});

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

  onFetchFromGitHub = path => {
    getIssuesOfRepository(path).then(result => this.setState(resolveIssuesQuery(result)));
  }

  onFetchMoreIssues = () => {

  }

  render() {
    const {path, organization} = this.state;

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
          {organization ? (
            <Organization organization={organization} onFetchMoreIssues={this.onFetchMoreIssues}/>
          ) : <p>No information yet.</p>}
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
      <button type="button" onClick={onFetchMoreIssues}>More</button>
    </div>
  )
}

const Organization = ({organization, errors, onFetchMoreIssues}) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    )
  }
  return (
    <div>
      <p>
        <strong>Issues from Organization:</strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository repository={organization.repository} onFetchMoreIssues={onFetchMoreIssues}/>
    </div>
  )
};


export default App;
